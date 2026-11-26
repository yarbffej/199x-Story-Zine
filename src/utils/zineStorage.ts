import { openDB, DBSchema } from 'idb';
import { CombatEncounter } from '../types';
import { ZineActs, ZineIssueData, buildZineIssueFromEncounter } from '../engine/zineEngine';
import { ZinePaletteId } from '../data/zinePalettes';

export interface ZineShelfRecord {
  id: string;
  issueNumber: number;
  createdAt: number;
  updatedAt: number;
  title: string;
  zinePaletteId: ZinePaletteId;
  encounter: CombatEncounter;
  acts: ZineActs;
  audioTitle?: string;
  // Binary Blobs persisted in IndexedDB
  videoBlob?: Blob;
  outroVideoBlob?: Blob;
  shotBlobs: (Blob | undefined)[];
  gif1Blob?: Blob;
  gif1IsVideo?: boolean;
  gif2Blob?: Blob;
  gif2IsVideo?: boolean;
  audioBlob?: Blob;
}

interface ZineShelfDBSchema extends DBSchema {
  issues: {
    key: string;
    value: ZineShelfRecord;
    indexes: { 'by-date': number };
  };
}

const ZINE_DB_NAME = '199x-zine-shelf-db';
const ZINE_STORE = 'issues';

// Module-level mutex prevents concurrent auto-save / manual-save / sync races from creating duplicate rows.
let storageLockChain: Promise<void> = Promise.resolve();
function withZineStorageLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = storageLockChain.then(fn, fn);
  storageLockChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function normKey(val?: string): string {
  return (val || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Stable content fingerprint for a Zine issue so re-saving, tab switching, or re-importing
 * the same Zine ALWAYS updates in-place instead of creating double/triple archive copies.
 */
export function getZineContentSignature(
  title?: string,
  encounter?: CombatEncounter
): string {
  const t = normKey(title || encounter?.anomaly_name || encounter?.entity_name);
  const loc = normKey(encounter?.location);
  const art = normKey(encounter?.protagonist_loadout?.nostalgia_artifact);
  const wep = normKey(encounter?.protagonist_loadout?.improvised_weapon);
  const dist = normKey(encounter?.cosmic_distortion).slice(0, 80);
  return `${t}|${loc}|${art}|${wep}|${dist}`;
}

function isSameLogicalZine(
  a: Pick<ZineShelfRecord, 'id' | 'title' | 'encounter' | 'createdAt'>,
  b: Pick<ZineShelfRecord, 'id' | 'title' | 'encounter' | 'createdAt'>
): boolean {
  if (a.id && b.id && a.id === b.id) return true;

  const titleA = normKey(a.title || a.encounter?.anomaly_name || a.encounter?.entity_name);
  const titleB = normKey(b.title || b.encounter?.anomaly_name || b.encounter?.entity_name);
  const locA = normKey(a.encounter?.location);
  const locB = normKey(b.encounter?.location);
  if (!titleA || titleA !== titleB) return false;

  // Exact encounter content match (title + location + gear + distortion)
  const sigA = getZineContentSignature(a.title, a.encounter);
  const sigB = getZineContentSignature(b.title, b.encounter);
  if (sigA === sigB && locA) return true;

  // Same title & location saved within 15 minutes of each other (double/triple save race)
  if (
    locA &&
    locA === locB &&
    a.createdAt &&
    b.createdAt &&
    Math.abs(a.createdAt - b.createdAt) < 15 * 60 * 1000
  ) {
    return true;
  }

  return false;
}

function mergeDuplicateCluster(cluster: ZineShelfRecord[]): ZineShelfRecord {
  if (cluster.length === 1) return cluster[0];
  // Sort oldest-updated -> newest-updated so newer edits take precedence while preserving ALL blobs
  const byUpdated = [...cluster].sort(
    (a, b) => (a.updatedAt || a.createdAt || 0) - (b.updatedAt || b.createdAt || 0)
  );
  const earliestCreated = cluster.reduce(
    (min, r) => Math.min(min, r.createdAt || Date.now()),
    cluster[0].createdAt || Date.now()
  );
  // Prefer a canonical zine-issue-... id if present, else earliest record's id
  const byCreated = [...cluster].sort(
    (a, b) => (a.createdAt || 0) - (b.createdAt || 0) || a.id.localeCompare(b.id)
  );
  const canonicalId =
    byCreated.find((r) => r.id.startsWith('zine-issue-'))?.id || byCreated[0].id;

  let merged: ZineShelfRecord = {
    ...byUpdated[0],
    id: canonicalId,
    createdAt: earliestCreated,
    shotBlobs: [
      byUpdated[0].shotBlobs?.[0],
      byUpdated[0].shotBlobs?.[1],
      byUpdated[0].shotBlobs?.[2],
      byUpdated[0].shotBlobs?.[3],
    ],
  };

  for (let i = 1; i < byUpdated.length; i++) {
    const next = byUpdated[i];
    merged = {
      ...merged,
      updatedAt: Math.max(merged.updatedAt || 0, next.updatedAt || 0),
      title: next.title || merged.title,
      zinePaletteId: next.zinePaletteId || merged.zinePaletteId,
      encounter: next.encounter || merged.encounter,
      acts: next.acts || merged.acts,
      audioTitle: next.audioTitle || merged.audioTitle,
      videoBlob: next.videoBlob ?? merged.videoBlob,
      outroVideoBlob: next.outroVideoBlob ?? merged.outroVideoBlob,
      shotBlobs: [
        next.shotBlobs?.[0] ?? merged.shotBlobs?.[0],
        next.shotBlobs?.[1] ?? merged.shotBlobs?.[1],
        next.shotBlobs?.[2] ?? merged.shotBlobs?.[2],
        next.shotBlobs?.[3] ?? merged.shotBlobs?.[3],
      ],
      gif1Blob: next.gif1Blob ?? merged.gif1Blob,
      gif1IsVideo: next.gif1Blob ? next.gif1IsVideo : merged.gif1IsVideo,
      gif2Blob: next.gif2Blob ?? merged.gif2Blob,
      gif2IsVideo: next.gif2Blob ? next.gif2IsVideo : merged.gif2IsVideo,
      audioBlob: next.audioBlob ?? merged.audioBlob,
    };
  }

  return merged;
}

/**
 * Pure helper that merges any duplicate copies (keeping all media blobs)
 * and renumbers every surviving archive issue consecutively starting at #1 (1, 2, 3...).
 */
export function dedupeAndRenumberZineRecords(records: ZineShelfRecord[]): {
  normalized: ZineShelfRecord[];
  idsToDelete: string[];
  recordsToPut: ZineShelfRecord[];
  removedDuplicates: number;
  renumberedCount: number;
} {
  const sortedInput = [...records].sort(
    (a, b) =>
      (a.createdAt || 0) - (b.createdAt || 0) ||
      (a.issueNumber || 0) - (b.issueNumber || 0) ||
      a.id.localeCompare(b.id)
  );

  const clusters: ZineShelfRecord[][] = [];
  for (const rec of sortedInput) {
    const matchCluster = clusters.find((c) => c.some((item) => isSameLogicalZine(item, rec)));
    if (matchCluster) {
      matchCluster.push(rec);
    } else {
      clusters.push([rec]);
    }
  }

  const idsToDelete: string[] = [];
  const recordsToPut: ZineShelfRecord[] = [];
  const mergedList: Array<{ record: ZineShelfRecord; wasMerged: boolean }> = [];

  for (const cluster of clusters) {
    const merged = mergeDuplicateCluster(cluster);
    const wasMerged = cluster.length > 1;
    if (wasMerged) {
      for (const item of cluster) {
        if (item.id !== merged.id) idsToDelete.push(item.id);
      }
    }
    mergedList.push({ record: merged, wasMerged });
  }

  // Sort unique issues chronologically so the oldest issue is always Issue #1, then #2, #3...
  mergedList.sort(
    (a, b) =>
      (a.record.createdAt || 0) - (b.record.createdAt || 0) ||
      (a.record.issueNumber || 0) - (b.record.issueNumber || 0) ||
      a.record.id.localeCompare(b.record.id)
  );

  let renumberedCount = 0;
  const normalized: ZineShelfRecord[] = mergedList.map((entry, idx) => {
    const targetNum = idx + 1;
    const needsNumFix =
      entry.record.issueNumber !== targetNum ||
      entry.record.encounter?.card_number !== targetNum;
    if (needsNumFix) renumberedCount++;

    const finalRecord: ZineShelfRecord = needsNumFix
      ? {
          ...entry.record,
          issueNumber: targetNum,
          encounter: {
            ...entry.record.encounter,
            card_number: targetNum,
          },
        }
      : entry.record;

    if (entry.wasMerged || needsNumFix) {
      recordsToPut.push(finalRecord);
    }
    return finalRecord;
  });

  return {
    normalized,
    idsToDelete,
    recordsToPut,
    removedDuplicates: idsToDelete.length,
    renumberedCount,
  };
}

async function initZineDB() {
  return openDB<ZineShelfDBSchema>(ZINE_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ZINE_STORE)) {
        const store = db.createObjectStore(ZINE_STORE, { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      }
    },
  });
}

async function normalizeShelfUnlocked(): Promise<{
  records: ZineShelfRecord[];
  removedDuplicates: number;
  renumberedCount: number;
  deletedIds: string[];
}> {
  const db = await initZineDB();
  const all = await db.getAll(ZINE_STORE);
  const { normalized, idsToDelete, recordsToPut, removedDuplicates, renumberedCount } =
    dedupeAndRenumberZineRecords(all);

  if (idsToDelete.length > 0 || recordsToPut.length > 0) {
    const tx = db.transaction(ZINE_STORE, 'readwrite');
    for (const delId of idsToDelete) {
      await tx.store.delete(delId);
    }
    for (const rec of recordsToPut) {
      await tx.store.put(rec);
    }
    await tx.done;
  }

  return {
    records: normalized,
    removedDuplicates,
    renumberedCount,
    deletedIds: idsToDelete,
  };
}

export async function saveZineIssueToShelf(params: {
  id?: string;
  issueNumber?: number;
  title?: string;
  zinePaletteId: ZinePaletteId;
  encounter: CombatEncounter;
  acts: ZineActs;
  audioTitle?: string;
  videoBlob?: Blob;
  outroVideoBlob?: Blob;
  shotBlobs: (Blob | undefined)[];
  gif1Blob?: Blob;
  gif1IsVideo?: boolean;
  gif2Blob?: Blob;
  gif2IsVideo?: boolean;
  audioBlob?: Blob;
}): Promise<ZineShelfRecord> {
  return withZineStorageLock(async () => {
    const db = await initZineDB();
    const { records: all } = await normalizeShelfUnlocked();

    const candidateTitle = params.title || params.encounter.entity_name || '';
    const candidateSig = getZineContentSignature(candidateTitle, params.encounter);

    // Match by explicit record ID first, then by exact encounter content signature so the same
    // Zine NEVER saves double or triple even across tab switches, reloads, or rapid clicks!
    const existing =
      (params.id ? all.find((r) => r.id === params.id) : undefined) ||
      all.find(
        (r) =>
          getZineContentSignature(r.title, r.encounter) === candidateSig &&
          Boolean(normKey(r.encounter?.location))
      );

    const assignedIssueNum = existing ? existing.issueNumber : all.length + 1;

    const record: ZineShelfRecord = {
      id:
        existing?.id ||
        params.id ||
        `zine-issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      issueNumber: assignedIssueNum,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      title: candidateTitle || `199X Issue #${assignedIssueNum}`,
      zinePaletteId: params.zinePaletteId,
      encounter: {
        ...params.encounter,
        card_number: assignedIssueNum,
      },
      acts: params.acts,
      audioTitle: params.audioTitle || existing?.audioTitle,
      videoBlob: params.videoBlob ?? existing?.videoBlob,
      outroVideoBlob: params.outroVideoBlob ?? existing?.outroVideoBlob,
      shotBlobs: [
        params.shotBlobs[0] ?? existing?.shotBlobs?.[0],
        params.shotBlobs[1] ?? existing?.shotBlobs?.[1],
        params.shotBlobs[2] ?? existing?.shotBlobs?.[2],
        params.shotBlobs[3] ?? existing?.shotBlobs?.[3],
      ],
      gif1Blob: params.gif1Blob ?? existing?.gif1Blob,
      gif1IsVideo: params.gif1IsVideo ?? existing?.gif1IsVideo,
      gif2Blob: params.gif2Blob ?? existing?.gif2Blob,
      gif2IsVideo: params.gif2IsVideo ?? existing?.gif2IsVideo,
      audioBlob: params.audioBlob ?? existing?.audioBlob,
    };

    await db.put(ZINE_STORE, record);
    const { records: finalList } = await normalizeShelfUnlocked();
    return finalList.find((r) => r.id === record.id) || record;
  });
}

export async function getAllZineShelfRecords(): Promise<ZineShelfRecord[]> {
  return withZineStorageLock(async () => {
    const { records } = await normalizeShelfUnlocked();
    return records;
  });
}

export async function deleteZineShelfIssue(id: string): Promise<void> {
  return withZineStorageLock(async () => {
    const db = await initZineDB();
    await db.delete(ZINE_STORE, id);
    // Automatically renumber remaining issues cleanly starting at #1 (#1, #2, #3...)
    await normalizeShelfUnlocked();
  });
}

export interface HydratedZineShelfIssue {
  record: ZineShelfRecord;
  issue: ZineIssueData;
  revokeUrls: () => void;
}

export function hydrateZineRecord(record: ZineShelfRecord): HydratedZineShelfIssue {
  const createdUrls: string[] = [];
  const makeUrl = (blob?: Blob, hashSuffix?: string) => {
    if (!blob) return undefined;
    const raw = URL.createObjectURL(blob);
    createdUrls.push(raw);
    return hashSuffix ? `${raw}${hashSuffix}` : raw;
  };

  const videoUrl = makeUrl(record.videoBlob);
  const outroVideoUrl = makeUrl(record.outroVideoBlob);
  const s0 = makeUrl(record.shotBlobs?.[0]);
  const s1 = makeUrl(record.shotBlobs?.[1]);
  const s2 = makeUrl(record.shotBlobs?.[2]);
  const s3 = makeUrl(record.shotBlobs?.[3]);
  const gifUrl = makeUrl(
    record.gif1Blob,
    record.gif1IsVideo || record.gif1Blob?.type.startsWith('video/') ? '#video' : undefined
  );
  const gifUrl2 = makeUrl(
    record.gif2Blob,
    record.gif2IsVideo || record.gif2Blob?.type.startsWith('video/') ? '#video' : undefined
  );
  const audioUrl = makeUrl(record.audioBlob);

  const issue = buildZineIssueFromEncounter(record.encounter, record.issueNumber, {
    acts: record.acts,
    videoUrl,
    outroVideoUrl,
    galleryUrls: [s0, s1, s2, s3],
    gifUrl,
    gifUrl2,
    audioUrl,
    audioTitle: record.audioTitle,
    cardImageUrl: s1 || s0 || s2,
    cardVideoUrl: videoUrl,
  });

  issue.id = record.id;
  issue.title = record.title;
  issue.zinePaletteId = record.zinePaletteId;

  return {
    record,
    issue,
    revokeUrls: () => {
      createdUrls.forEach((u) => URL.revokeObjectURL(u));
    },
  };
}

export interface PortableZinePackV1 {
  format: '199x-zine-pack-v1';
  id?: string;
  createdAt?: number;
  updatedAt?: number;
  exportedAt: number;
  issueNumber: number;
  title: string;
  zinePaletteId: ZinePaletteId;
  encounter: CombatEncounter;
  acts: ZineActs;
  audioTitle?: string;
  media: {
    videoDataUri?: string | null;
    outroVideoDataUri?: string | null;
    shotDataUris: (string | null)[];
    gif1DataUri?: string | null;
    gif1IsVideo?: boolean;
    gif2DataUri?: string | null;
    gif2IsVideo?: boolean;
    audioDataUri?: string | null;
  };
}

export interface PortableZineShelfBundleV1 {
  format: '199x-zine-shelf-bundle-v1';
  exportedAt: number;
  issues: PortableZinePackV1[];
}

async function blobOrUrlToDataUri(blob?: Blob, fallbackUrl?: string): Promise<string | null> {
  let targetBlob = blob;
  if (!targetBlob && fallbackUrl) {
    if (fallbackUrl.startsWith('data:')) return fallbackUrl;
    try {
      const cleanUrl = fallbackUrl.split('#')[0];
      const res = await fetch(cleanUrl);
      if (res.ok) targetBlob = await res.blob();
    } catch {
      return null;
    }
  }
  if (!targetBlob) return null;
  return await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(targetBlob);
  });
}

async function dataUriToBlob(dataUri?: string | null): Promise<Blob | undefined> {
  if (!dataUri || !dataUri.startsWith('data:')) return undefined;
  try {
    const res = await fetch(dataUri);
    return await res.blob();
  } catch {
    return undefined;
  }
}

export async function serializeShelfRecordToPack(
  record: ZineShelfRecord
): Promise<PortableZinePackV1> {
  const videoDataUri = await blobOrUrlToDataUri(record.videoBlob);
  const outroVideoDataUri = await blobOrUrlToDataUri(record.outroVideoBlob);
  const shotDataUris: (string | null)[] = [null, null, null, null];
  for (let i = 0; i < 4; i++) {
    shotDataUris[i] = await blobOrUrlToDataUri(record.shotBlobs?.[i]);
  }
  const gif1DataUri = await blobOrUrlToDataUri(record.gif1Blob);
  const gif2DataUri = await blobOrUrlToDataUri(record.gif2Blob);
  const audioDataUri = await blobOrUrlToDataUri(record.audioBlob);

  return {
    format: '199x-zine-pack-v1',
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    exportedAt: Date.now(),
    issueNumber: record.issueNumber,
    title: record.title,
    zinePaletteId: record.zinePaletteId,
    encounter: record.encounter,
    acts: record.acts,
    audioTitle: record.audioTitle,
    media: {
      videoDataUri,
      outroVideoDataUri,
      shotDataUris,
      gif1DataUri,
      gif1IsVideo: Boolean(
        record.gif1IsVideo || record.gif1Blob?.type.startsWith('video/')
      ),
      gif2DataUri,
      gif2IsVideo: Boolean(
        record.gif2IsVideo || record.gif2Blob?.type.startsWith('video/')
      ),
      audioDataUri,
    },
  };
}

/**
 * Upserts a PortableZinePackV1 into IndexedDB without duplicating an already-present issue.
 */
export async function upsertZinePackToShelf(
  pack: PortableZinePackV1
): Promise<{ record: ZineShelfRecord; status: 'imported' | 'updated' | 'skipped' }> {
  return withZineStorageLock(async () => {
    const db = await initZineDB();
    const { records: all } = await normalizeShelfUnlocked();

    const packSig = getZineContentSignature(pack.title, pack.encounter);

    // Match by exact record id first, then exact encounter content signature so re-importing
    // or syncing a Drive/Folder pack NEVER duplicates an already-present Zine!
    const existing =
      (pack.id ? all.find((r) => r.id === pack.id) : undefined) ||
      all.find(
        (r) =>
          getZineContentSignature(r.title, r.encounter) === packSig &&
          Boolean(normKey(r.encounter?.location))
      ) ||
      all.find(
        (r) =>
          normKey(r.title) === normKey(pack.title) &&
          normKey(r.encounter?.location) === normKey(pack.encounter?.location) &&
          Math.abs((r.createdAt || 0) - (pack.createdAt || pack.exportedAt || 0)) < 15 * 60_000
      );

    const incomingUpdated = pack.updatedAt || pack.exportedAt || Date.now();
    if (existing && (existing.updatedAt || 0) >= incomingUpdated) {
      return { record: existing, status: 'skipped' };
    }

    const videoBlob = await dataUriToBlob(pack.media?.videoDataUri);
    const outroVideoBlob = await dataUriToBlob(pack.media?.outroVideoDataUri);
    const s0 = await dataUriToBlob(pack.media?.shotDataUris?.[0]);
    const s1 = await dataUriToBlob(pack.media?.shotDataUris?.[1]);
    const s2 = await dataUriToBlob(pack.media?.shotDataUris?.[2]);
    const s3 = await dataUriToBlob(pack.media?.shotDataUris?.[3]);
    const gif1Blob = await dataUriToBlob(pack.media?.gif1DataUri);
    const gif2Blob = await dataUriToBlob(pack.media?.gif2DataUri);
    const audioBlob = await dataUriToBlob(pack.media?.audioDataUri);

    const assignedIssueNum = existing ? existing.issueNumber : all.length + 1;

    const record: ZineShelfRecord = {
      id:
        existing?.id ||
        pack.id ||
        `zine-issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      issueNumber: assignedIssueNum,
      createdAt: existing?.createdAt || pack.createdAt || pack.exportedAt || Date.now(),
      updatedAt: incomingUpdated,
      title: pack.title || pack.encounter.entity_name || `199X Issue #${assignedIssueNum}`,
      zinePaletteId: pack.zinePaletteId,
      encounter: {
        ...pack.encounter,
        card_number: assignedIssueNum,
      },
      acts: pack.acts,
      audioTitle: pack.audioTitle || existing?.audioTitle,
      videoBlob: videoBlob ?? existing?.videoBlob,
      outroVideoBlob: outroVideoBlob ?? existing?.outroVideoBlob,
      shotBlobs: [
        s0 ?? existing?.shotBlobs?.[0],
        s1 ?? existing?.shotBlobs?.[1],
        s2 ?? existing?.shotBlobs?.[2],
        s3 ?? existing?.shotBlobs?.[3],
      ],
      gif1Blob: gif1Blob ?? existing?.gif1Blob,
      gif1IsVideo: pack.media?.gif1IsVideo ?? existing?.gif1IsVideo,
      gif2Blob: gif2Blob ?? existing?.gif2Blob,
      gif2IsVideo: pack.media?.gif2IsVideo ?? existing?.gif2IsVideo,
      audioBlob: audioBlob ?? existing?.audioBlob,
    };

    await db.put(ZINE_STORE, record);
    const { records: finalList } = await normalizeShelfUnlocked();
    const resolved = finalList.find((r) => r.id === record.id) || record;
    return { record: resolved, status: existing ? 'updated' : 'imported' };
  });
}

/**
 * Exports a single Zine Issue (including all 8 media files) as a portable `.zine.json` file
 * ideal for saving to Google Drive and opening on mobile / another device via Pocket Zine Reader.
 */
export async function exportZineIssueForDrive(
  issue: ZineIssueData,
  blobs?: {
    videoBlob?: Blob;
    outroVideoBlob?: Blob;
    shotBlobs?: (Blob | undefined)[];
    gif1Blob?: Blob;
    gif1IsVideo?: boolean;
    gif2Blob?: Blob;
    gif2IsVideo?: boolean;
    audioBlob?: Blob;
  }
): Promise<void> {
  const videoDataUri = await blobOrUrlToDataUri(blobs?.videoBlob, issue.videoUrl);
  const outroVideoDataUri = await blobOrUrlToDataUri(
    blobs?.outroVideoBlob,
    issue.outroVideoUrl
  );
  const shotDataUris: (string | null)[] = [null, null, null, null];
  for (let i = 0; i < 4; i++) {
    shotDataUris[i] = await blobOrUrlToDataUri(
      blobs?.shotBlobs?.[i],
      issue.galleryUrls[i]
    );
  }
  const gif1DataUri = await blobOrUrlToDataUri(blobs?.gif1Blob, issue.gifUrl);
  const gif2DataUri = await blobOrUrlToDataUri(blobs?.gif2Blob, issue.gifUrl2);
  const audioDataUri = await blobOrUrlToDataUri(blobs?.audioBlob, issue.audioUrl);

  const pack: PortableZinePackV1 = {
    format: '199x-zine-pack-v1',
    id: issue.id,
    updatedAt: Date.now(),
    exportedAt: Date.now(),
    issueNumber: issue.issueNumber,
    title: issue.title,
    zinePaletteId: issue.zinePaletteId,
    encounter: issue.encounter,
    acts: issue.acts,
    audioTitle: issue.audioTitle,
    media: {
      videoDataUri,
      outroVideoDataUri,
      shotDataUris,
      gif1DataUri,
      gif1IsVideo:
        blobs?.gif1IsVideo || Boolean(issue.gifUrl?.endsWith('#video')),
      gif2DataUri,
      gif2IsVideo:
        blobs?.gif2IsVideo || Boolean(issue.gifUrl2?.endsWith('#video')),
      audioDataUri,
    },
  };

  const safeSlug = (issue.title || 'ZINE')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const formattedNum = String(issue.issueNumber).padStart(2, '0');
  const jsonBlob = new Blob([JSON.stringify(pack)], {
    type: 'application/json;charset=utf-8',
  });
  const dlUrl = URL.createObjectURL(jsonBlob);
  const link = document.createElement('a');
  link.href = dlUrl;
  link.download = `199X_DRIVE_ZINE_${formattedNum}_${safeSlug}.zine.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(dlUrl), 5000);
}

/**
 * Exports EVERY saved Zine Issue on the Shelf into ONE portable `.zineshelf.json` bundle.
 */
export async function exportEntireZineShelfForDrive(): Promise<number> {
  const all = await getAllZineShelfRecords();
  if (!all.length) return 0;

  const issues: PortableZinePackV1[] = [];
  for (const rec of all) {
    issues.push(await serializeShelfRecordToPack(rec));
  }

  const bundle: PortableZineShelfBundleV1 = {
    format: '199x-zine-shelf-bundle-v1',
    exportedAt: Date.now(),
    issues,
  };

  const jsonBlob = new Blob([JSON.stringify(bundle)], {
    type: 'application/json;charset=utf-8',
  });
  const dlUrl = URL.createObjectURL(jsonBlob);
  const link = document.createElement('a');
  link.href = dlUrl;
  link.download = `199X_FULL_ZINE_SHELF_${all.length}_ISSUES.zineshelf.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(dlUrl), 5000);
  return all.length;
}

/**
 * Imports one or more `.zine.json` or `.zineshelf.json` files into IndexedDB Zine Shelf.
 */
export async function importZineFilesFromDrive(
  files: FileList | File[]
): Promise<{
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  records: ZineShelfRecord[];
}> {
  const list = Array.from(files);
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const records: ZineShelfRecord[] = [];

  for (const file of list) {
    const rawText = await file.text();
    const parsed = JSON.parse(rawText) as PortableZinePackV1 | PortableZineShelfBundleV1;

    if (
      parsed &&
      parsed.format === '199x-zine-shelf-bundle-v1' &&
      Array.isArray(parsed.issues)
    ) {
      for (const issuePack of parsed.issues) {
        if (issuePack?.format === '199x-zine-pack-v1' && issuePack.encounter) {
          const res = await upsertZinePackToShelf(issuePack);
          records.push(res.record);
          if (res.status === 'imported') importedCount++;
          else if (res.status === 'updated') updatedCount++;
          else skippedCount++;
        }
      }
    } else if (
      parsed &&
      parsed.format === '199x-zine-pack-v1' &&
      parsed.encounter
    ) {
      const res = await upsertZinePackToShelf(parsed);
      records.push(res.record);
      if (res.status === 'imported') importedCount++;
      else if (res.status === 'updated') updatedCount++;
      else skippedCount++;
    } else {
      throw new Error(`Not a valid 199X .zine.json or .zineshelf.json file: ${file.name}`);
    }
  }

  return { importedCount, updatedCount, skippedCount, records };
}

/**
 * Imports a single `.zine.json` file picked from Google Drive / Files directly into IndexedDB Zine Shelf.
 */
export async function importZineIssueFromDriveFile(
  file: File
): Promise<ZineShelfRecord> {
  const result = await importZineFilesFromDrive([file]);
  if (!result.records.length) {
    throw new Error('No zine issue found in file');
  }
  return result.records[0];
}
