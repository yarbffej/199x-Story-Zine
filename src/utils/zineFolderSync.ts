import { openDB } from 'idb';
import {
  ZineShelfRecord,
  PortableZinePackV1,
  PortableZineShelfBundleV1,
  getAllZineShelfRecords,
  serializeShelfRecordToPack,
  upsertZinePackToShelf,
} from './zineStorage';

export interface SyncWritableStream {
  write: (data: string | Blob) => Promise<void>;
  close: () => Promise<void>;
}

export interface SyncFileHandle {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<SyncWritableStream>;
}

export interface SyncDirHandle {
  kind: 'directory';
  name: string;
  entries: () => AsyncIterable<[string, SyncFileHandle | SyncDirHandle]>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<SyncFileHandle>;
  removeEntry: (name: string) => Promise<void>;
  queryPermission?: (desc?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission?: (desc?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<'granted' | 'denied' | 'prompt'>;
}

const SYNC_DB_NAME = '199x-zine-folder-sync-db';
const SYNC_STORE = 'handles';
const SYNC_FOLDER_KEY = 'shared-zine-folder';

async function initSyncMetaDB() {
  return openDB(SYNC_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE);
      }
    },
  });
}

export function isFolderSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === 'function'
  );
}

export async function getSavedSyncFolderHandle(): Promise<SyncDirHandle | null> {
  if (!isFolderSyncSupported()) return null;
  try {
    const db = await initSyncMetaDB();
    const handle = (await db.get(SYNC_STORE, SYNC_FOLDER_KEY)) as
      | SyncDirHandle
      | undefined;
    return handle || null;
  } catch {
    return null;
  }
}

export async function getSyncFolderPermissionState(
  handle: SyncDirHandle
): Promise<'granted' | 'prompt' | 'denied'> {
  try {
    if (typeof handle.queryPermission === 'function') {
      return await handle.queryPermission({ mode: 'readwrite' });
    }
    return 'granted';
  } catch {
    return 'prompt';
  }
}

export async function pickAndSaveSyncFolder(): Promise<SyncDirHandle | null> {
  if (!isFolderSyncSupported()) return null;
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts?: {
        id?: string;
        mode?: 'read' | 'readwrite';
        startIn?: string;
      }) => Promise<SyncDirHandle>;
    }
  ).showDirectoryPicker;

  try {
    const handle = await picker({
      id: '199x-zine-sync-folder',
      mode: 'readwrite',
      startIn: 'documents',
    });
    const db = await initSyncMetaDB();
    await db.put(SYNC_STORE, handle, SYNC_FOLDER_KEY);
    return handle;
  } catch (err) {
    // User cancelled picker
    if ((err as { name?: string })?.name === 'AbortError') return null;
    throw err;
  }
}

export async function disconnectSyncFolder(): Promise<void> {
  try {
    const db = await initSyncMetaDB();
    await db.delete(SYNC_STORE, SYNC_FOLDER_KEY);
  } catch {
    // ignore
  }
}

function buildRecordFileName(record: ZineShelfRecord): string {
  const num = String(record.issueNumber || 1).padStart(2, '0');
  const slug = (record.title || 'ZINE')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 36);
  const safeId = record.id.replace(/[^a-zA-Z0-9_-]+/g, '');
  return `199X_Issue_${num}_${slug}__${safeId}.zine.json`;
}

async function writePackToFile(
  dirHandle: SyncDirHandle,
  fileName: string,
  pack: PortableZinePackV1
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(pack));
  await writable.close();
}

export interface FolderSyncResult {
  pulled: number;
  pushed: number;
  total: number;
  folderName: string;
  needsPermission?: boolean;
}

/**
 * Bidirectional sync between this browser's IndexedDB Zine Shelf and the user's shared folder.
 * Pulls new/updated `.zine.json` & `.zineshelf.json` files from the folder, and pushes local zines out.
 */
export async function syncShelfWithFolder(
  dirHandle: SyncDirHandle,
  options?: { requestPermission?: boolean }
): Promise<FolderSyncResult> {
  let perm = await getSyncFolderPermissionState(dirHandle);
  if (perm !== 'granted' && options?.requestPermission && typeof dirHandle.requestPermission === 'function') {
    perm = await dirHandle.requestPermission({ mode: 'readwrite' });
  }
  if (perm !== 'granted') {
    return {
      pulled: 0,
      pushed: 0,
      total: (await getAllZineShelfRecords()).length,
      folderName: dirHandle.name,
      needsPermission: true,
    };
  }

  let pulled = 0;
  let pushed = 0;

  // Map of recordId -> { updatedAt, fileName } already in the shared folder
  const folderIndex = new Map<string, { updatedAt: number; fileName: string }>();

  // 1. Scan & PULL from folder
  for await (const [fileName, entry] of dirHandle.entries()) {
    if (entry.kind !== 'file') continue;
    const lower = fileName.toLowerCase();
    if (!lower.endsWith('.zine.json') && !lower.endsWith('.zineshelf.json')) continue;

    try {
      const file = await entry.getFile();
      const rawText = await file.text();
      const parsed = JSON.parse(rawText) as
        | PortableZinePackV1
        | PortableZineShelfBundleV1;

      if (
        parsed &&
        parsed.format === '199x-zine-shelf-bundle-v1' &&
        Array.isArray(parsed.issues)
      ) {
        for (const pack of parsed.issues) {
          if (pack?.format === '199x-zine-pack-v1' && pack.encounter) {
            const res = await upsertZinePackToShelf(pack);
            if (res.status === 'imported' || res.status === 'updated') pulled++;
          }
        }
      } else if (
        parsed &&
        parsed.format === '199x-zine-pack-v1' &&
        parsed.encounter
      ) {
        const res = await upsertZinePackToShelf(parsed);
        if (res.status === 'imported' || res.status === 'updated') pulled++;
        const idKey = parsed.id || res.record.id;
        folderIndex.set(idKey, {
          updatedAt: parsed.updatedAt || parsed.exportedAt || file.lastModified || 0,
          fileName,
        });
      }
    } catch {
      // Skip malformed or partially-written JSON files safely
    }
  }

  // 2. PUSH local records missing from folder or newer locally
  const localRecords = await getAllZineShelfRecords();
  for (const rec of localRecords) {
    const existingInFolder = folderIndex.get(rec.id);
    if (!existingInFolder || (rec.updatedAt || 0) > existingInFolder.updatedAt) {
      try {
        const pack = await serializeShelfRecordToPack(rec);
        const targetFileName = existingInFolder?.fileName || buildRecordFileName(rec);
        await writePackToFile(dirHandle, targetFileName, pack);
        pushed++;
      } catch {
        // Ignore single-file write failure so rest of sync finishes
      }
    }
  }

  return {
    pulled,
    pushed,
    total: localRecords.length,
    folderName: dirHandle.name,
  };
}

/**
 * Silently pushes a newly saved/updated record to the connected sync folder if permission is already granted.
 */
export async function pushSingleRecordToConnectedFolder(
  record: ZineShelfRecord
): Promise<boolean> {
  const dirHandle = await getSavedSyncFolderHandle();
  if (!dirHandle) return false;

  const perm = await getSyncFolderPermissionState(dirHandle);
  if (perm !== 'granted') return false;

  try {
    // Reuse existing filename for this record ID if present
    let targetFileName = buildRecordFileName(record);
    const idToken = `__${record.id.replace(/[^a-zA-Z0-9_-]+/g, '')}.zine.json`;
    for await (const [fileName, entry] of dirHandle.entries()) {
      if (entry.kind === 'file' && fileName.endsWith(idToken)) {
        targetFileName = fileName;
        break;
      }
    }
    const pack = await serializeShelfRecordToPack(record);
    await writePackToFile(dirHandle, targetFileName, pack);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deletes the matching `.zine.json` file from the connected sync folder when an issue is deleted from the Shelf.
 */
export async function removeRecordFromConnectedFolder(
  recordId: string
): Promise<void> {
  const dirHandle = await getSavedSyncFolderHandle();
  if (!dirHandle) return;

  const perm = await getSyncFolderPermissionState(dirHandle);
  if (perm !== 'granted') return;

  const idToken = `__${recordId.replace(/[^a-zA-Z0-9_-]+/g, '')}.zine.json`;
  try {
    for await (const [fileName, entry] of dirHandle.entries()) {
      if (entry.kind !== 'file') continue;
      if (fileName.endsWith(idToken)) {
        await dirHandle.removeEntry(fileName);
        return;
      }
      if (fileName.toLowerCase().endsWith('.zine.json')) {
        try {
          const text = await (await entry.getFile()).text();
          const parsed = JSON.parse(text) as { id?: string };
          if (parsed?.id === recordId) {
            await dirHandle.removeEntry(fileName);
            return;
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}
