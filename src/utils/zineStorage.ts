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
  const db = await initZineDB();
  const all = await db.getAll(ZINE_STORE);

  const normTitle = (params.title || params.encounter.entity_name || '').trim().toLowerCase();
  const existing = params.id
    ? all.find((r) => r.id === params.id)
    : all.find((r) => r.title.trim().toLowerCase() === normTitle);

  const maxIssueNum = all.reduce((max, r) => Math.max(max, r.issueNumber || 0), 0);
  const assignedIssueNum =
    params.issueNumber || existing?.issueNumber || maxIssueNum + 1;

  const record: ZineShelfRecord = {
    id:
      existing?.id ||
      params.id ||
      `zine-issue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    issueNumber: assignedIssueNum,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
    title: params.title || params.encounter.entity_name || `199X Issue #${assignedIssueNum}`,
    zinePaletteId: params.zinePaletteId,
    encounter: {
      ...params.encounter,
      card_number: params.encounter.card_number || assignedIssueNum,
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
  return record;
}

export async function getAllZineShelfRecords(): Promise<ZineShelfRecord[]> {
  const db = await initZineDB();
  const all = await db.getAll(ZINE_STORE);
  return all.sort((a, b) => a.issueNumber - b.issueNumber || a.createdAt - b.createdAt);
}

export async function deleteZineShelfIssue(id: string): Promise<void> {
  const db = await initZineDB();
  await db.delete(ZINE_STORE, id);
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

interface PortableZinePackV1 {
  format: '199x-zine-pack-v1';
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
 * Imports a `.zine.json` file picked from Google Drive / Files directly into IndexedDB Zine Shelf.
 */
export async function importZineIssueFromDriveFile(
  file: File
): Promise<ZineShelfRecord> {
  const rawText = await file.text();
  const parsed = JSON.parse(rawText) as PortableZinePackV1;
  if (!parsed || parsed.format !== '199x-zine-pack-v1' || !parsed.encounter) {
    throw new Error('Not a valid 199X .zine.json pack file');
  }

  const videoBlob = await dataUriToBlob(parsed.media?.videoDataUri);
  const outroVideoBlob = await dataUriToBlob(parsed.media?.outroVideoDataUri);
  const s0 = await dataUriToBlob(parsed.media?.shotDataUris?.[0]);
  const s1 = await dataUriToBlob(parsed.media?.shotDataUris?.[1]);
  const s2 = await dataUriToBlob(parsed.media?.shotDataUris?.[2]);
  const s3 = await dataUriToBlob(parsed.media?.shotDataUris?.[3]);
  const gif1Blob = await dataUriToBlob(parsed.media?.gif1DataUri);
  const gif2Blob = await dataUriToBlob(parsed.media?.gif2DataUri);
  const audioBlob = await dataUriToBlob(parsed.media?.audioDataUri);

  return await saveZineIssueToShelf({
    issueNumber: parsed.issueNumber,
    title: parsed.title,
    zinePaletteId: parsed.zinePaletteId,
    encounter: parsed.encounter,
    acts: parsed.acts,
    audioTitle: parsed.audioTitle,
    videoBlob,
    outroVideoBlob,
    shotBlobs: [s0, s1, s2, s3],
    gif1Blob,
    gif1IsVideo: parsed.media?.gif1IsVideo,
    gif2Blob,
    gif2IsVideo: parsed.media?.gif2IsVideo,
    audioBlob,
  });
}
