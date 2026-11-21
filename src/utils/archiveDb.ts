import { openDB, DBSchema } from 'idb';
import { CombatEncounter, ChecklistItem } from '../types';
import { generateChecklistCardCanvasBlob } from './checklistGenerator';

export interface ArchiveCardRecord {
  id: string;
  createdAt: number;
  encounter: CombatEncounter;
  imageBlob: Blob;
  imageName: string;
  videoBlob?: Blob;
  videoName?: string;
  mediaType?: 'image' | 'video';
}

export interface ArchiveDBSchema extends DBSchema {
  cards: {
    key: string;
    value: ArchiveCardRecord;
    indexes: { 'by-date': number };
  };
}

export const DB_NAME = '199x-archive-db';
export const STORE_NAME = 'cards';

export function extractVideoPosterFrame(videoFile: File | Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;
    let hasResolved = false;
    const cleanupAndResolve = (blob: Blob) => {
      if (hasResolved) return;
      hasResolved = true;
      URL.revokeObjectURL(objectUrl);
      resolve(blob);
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (!ctx) return cleanupAndResolve(videoFile);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanupAndResolve(blob || videoFile);
        }, 'image/png');
      } catch {
        cleanupAndResolve(videoFile);
      }
    };

    video.onerror = () => cleanupAndResolve(videoFile);
    setTimeout(() => cleanupAndResolve(videoFile), 3500);
  });
}

export async function initArchiveDB() {
  return openDB<ArchiveDBSchema>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-date', 'createdAt');
      }
    },
  });
}

// Re-indexes all cards in the album so they are strictly contiguous (#00 for Checklist, #01..#N for specimens)
// and automatically synchronizes the checklist items with all currently present specimens.
export async function reindexArchiveCards(): Promise<ArchiveCardRecord[]> {
  const db = await initArchiveDB();
  const all = await db.getAll(STORE_NAME);

  const checklistCards = all.filter(c => 
    c.encounter?.card_number === 0 || 
    c.encounter?.card_type === 'checklist' || 
    c.imageName.includes('checklist')
  );

  // Prioritize any checklist that has a video reel, then the newest
  checklistCards.sort((a, b) => (b.videoBlob ? 1 : 0) - (a.videoBlob ? 1 : 0) || b.createdAt - a.createdAt);
  const checklist = checklistCards[0];

  const tx = db.transaction(STORE_NAME, 'readwrite');

  // Purge any redundant duplicate checklist entries from IndexedDB
  if (checklistCards.length > 1) {
    for (let j = 1; j < checklistCards.length; j++) {
      await tx.store.delete(checklistCards[j].id);
    }
  }

  const specimens = all
    .filter(c => !checklistCards.some(chk => chk.id === c.id) && c.encounter?.card_number !== 0 && c.encounter?.card_type !== 'checklist')
    .sort((a, b) => a.createdAt - b.createdAt); // Order chronologically

  for (let i = 0; i < specimens.length; i++) {
    const card = specimens[i];
    card.encounter.card_number = i + 1;
    await tx.store.put(card);
  }

  if (checklist) {
    checklist.encounter.card_number = 0;
    checklist.encounter.card_type = 'checklist';

    // Synchronize checklist items with all active specimens
    const updatedItems: ChecklistItem[] = specimens.map((c, idx) => ({
      number: idx + 1,
      name: c.encounter?.entity_name || `Specimen #${idx + 1}`,
      checked: true,
      rarity: c.encounter?.card_foil_rarity || 'standard',
      threatColor: c.encounter?.threat_level_color || '#FF007F',
      status: 'SECURED'
    }));

    checklist.encounter.checklist_items = updatedItems;
    checklist.encounter.checklist_subtitle = `SUBURBAN ROGUELIKE ARCHIVE • ${updatedItems.length} OF 53 SPECIMENS REGISTERED`;
    checklist.encounter.combat_ticker = [
      `${updatedItems.length} OF 53 SPECIMENS REGISTERED`,
      'SHEET 1 POCKET 1 PERMANENT CAPSTONE ANCHOR',
      'SERIES 2 OFFICIALLY SECURED'
    ];
    await tx.store.put(checklist);
  }

  await tx.done;
  return getAllArchiveCards();
}

/**
 * Performs a deep synchronization of the Master Checklist Card:
 * - Renumbers all album specimens sequentially 1..N
 * - Regenerates the full checklist register
 * - Re-rasterizes the canvas artwork so the card face reflects all current specimens
 * - Preserves any existing VHS video loop
 */
export async function syncMasterChecklist(): Promise<ArchiveCardRecord> {
  const db = await initArchiveDB();
  const all = await db.getAll(STORE_NAME);

  const checklistCards = all.filter(c => 
    c.encounter?.card_number === 0 || 
    c.encounter?.card_type === 'checklist' || 
    c.imageName.includes('checklist')
  );

  checklistCards.sort((a, b) => (b.videoBlob ? 1 : 0) - (a.videoBlob ? 1 : 0) || b.createdAt - a.createdAt);
  const primaryChecklist = checklistCards[0] || null;

  // Clean up duplicate checklist records
  if (checklistCards.length > 1) {
    for (let j = 1; j < checklistCards.length; j++) {
      await db.delete(STORE_NAME, checklistCards[j].id);
    }
  }

  // Specimens sorted chronologically
  const specimens = all
    .filter(c => !checklistCards.some(chk => chk.id === c.id) && c.encounter?.card_number !== 0 && c.encounter?.card_type !== 'checklist')
    .sort((a, b) => a.createdAt - b.createdAt);

  // Renumber specimens in DB
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (let i = 0; i < specimens.length; i++) {
    const card = specimens[i];
    card.encounter.card_number = i + 1;
    await tx.store.put(card);
  }
  await tx.done;

  // Build synchronized item register
  const updatedItems: ChecklistItem[] = specimens.map((c, idx) => ({
    number: idx + 1,
    name: c.encounter?.entity_name || `Specimen #${idx + 1}`,
    checked: true,
    rarity: c.encounter?.card_foil_rarity || 'standard',
    threatColor: c.encounter?.threat_level_color || '#FF007F',
    status: 'SECURED'
  }));

  const title = primaryChecklist?.encounter?.entity_name || '199X SERIES 2 MASTER CHECKLIST';
  const subtitle = `SUBURBAN ROGUELIKE ARCHIVE • ${updatedItems.length} OF 53 SPECIMENS REGISTERED`;

  const updatedEncounter: CombatEncounter = {
    ...(primaryChecklist?.encounter || {}),
    entity_name: title,
    cosmic_distortion: subtitle,
    threat_level_color: '#FFE600',
    card_number: 0,
    card_type: 'checklist',
    card_foil_rarity: primaryChecklist?.encounter?.card_foil_rarity || 'prism',
    is_foil: true,
    card_theme: primaryChecklist?.encounter?.card_theme || 'prismatic-refractor',
    checklist_items: updatedItems,
    checklist_subtitle: subtitle,
    protagonist_loadout: primaryChecklist?.encounter?.protagonist_loadout || {
      nostalgia_artifact: 'Trapper Keeper 3-Ring Binder',
      improvised_weapon: 'Ultra PRO 9-Pocket Pages',
      weird_synergy_effect: '100% Series 2 Set Completion Aura'
    },
    combat_ticker: [
      `${updatedItems.length} OF 53 SPECIMENS REGISTERED`,
      'SHEET 1 POCKET 1 PERMANENT CAPSTONE ANCHOR',
      'SERIES 2 OFFICIALLY SECURED'
    ],
    status_affliction: 'ARCHIVE COMPLETE',
    critical_smash: true,
    visual_generation_prompt: '1990s retro trading card checklist, neon yellow and cyan grid, specimen registry',
    video_generation_prompt: ''
  };

  // Re-rasterize checklist canvas so the image stored in IndexedDB is fresh
  let imageBlob = primaryChecklist?.imageBlob;
  try {
    imageBlob = await generateChecklistCardCanvasBlob(updatedEncounter, 0, updatedItems);
  } catch (err) {
    console.warn('Canvas rasterization in syncMasterChecklist failed, preserving prior image:', err);
  }

  const record: ArchiveCardRecord = {
    id: primaryChecklist?.id || `checklist-${Date.now()}`,
    createdAt: primaryChecklist?.createdAt || Date.now(),
    encounter: updatedEncounter,
    imageBlob: imageBlob || new Blob([], { type: 'image/png' }),
    imageName: primaryChecklist?.imageName || 'series-2-master-checklist-card-00.png',
    videoBlob: primaryChecklist?.videoBlob,
    videoName: primaryChecklist?.videoName || (primaryChecklist?.videoBlob ? 'series-2-master-checklist-reel.webm' : undefined),
    mediaType: primaryChecklist?.videoBlob ? 'video' : 'image',
  };

  await db.put(STORE_NAME, record);
  return record;
}

export async function saveCardToArchive(
  encounter: CombatEncounter,
  imageBlob: Blob,
  imageName: string = 'encounter-art.png',
  videoBlob?: Blob,
  videoName?: string,
  mediaType: 'image' | 'video' = videoBlob ? 'video' : 'image'
): Promise<ArchiveCardRecord> {
  const db = await initArchiveDB();
  const existingCards = await db.getAll(STORE_NAME);

  const isChecklist = encounter.card_type === 'checklist' || encounter.card_number === 0;

  // When saving a checklist, explicitly find ANY existing checklist record rather than matching on entity_name
  const normTargetName = (encounter.entity_name || '').trim().toLowerCase();
  const existingRecord = isChecklist
    ? existingCards.find(c => 
        c.encounter?.card_number === 0 || 
        c.encounter?.card_type === 'checklist' || 
        c.imageName.includes('checklist')
      )
    : existingCards.find(c => 
        (c.encounter?.entity_name || '').trim().toLowerCase() === normTargetName
      );

  // If saving a checklist, clean up any duplicate checklist records in IndexedDB
  if (isChecklist) {
    for (const card of existingCards) {
      if (
        (card.encounter?.card_number === 0 || card.encounter?.card_type === 'checklist' || card.imageName.includes('checklist')) &&
        card.id !== existingRecord?.id
      ) {
        await db.delete(STORE_NAME, card.id);
      }
    }
  }

  // Determine sequential card number
  let assignedNumber = encounter.card_number;
  if (isChecklist) {
    assignedNumber = 0;
  } else if (existingRecord?.encounter?.card_number !== undefined) {
    assignedNumber = existingRecord.encounter.card_number;
  } else {
    // Find highest specimen number currently in database
    const specimenNums = existingCards
      .filter(c => c.encounter?.card_number !== 0 && c.encounter?.card_type !== 'checklist')
      .map(c => c.encounter?.card_number || 0);
    const maxNum = specimenNums.length > 0 ? Math.max(...specimenNums) : 0;
    assignedNumber = maxNum + 1;
  }

  const enrichedEncounter: CombatEncounter = {
    ...(existingRecord?.encounter || encounter),
    ...encounter,
    card_number: assignedNumber,
    card_type: isChecklist ? 'checklist' : (encounter.card_type || 'bad_guy'),
    is_foil: encounter.is_foil ?? false,
  };

  const record: ArchiveCardRecord = {
    id: existingRecord?.id || `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: existingRecord?.createdAt || Date.now(),
    encounter: enrichedEncounter,
    imageBlob: imageBlob || existingRecord?.imageBlob,
    imageName: imageName || existingRecord?.imageName || 'encounter-art.png',
    videoBlob: videoBlob || existingRecord?.videoBlob,
    videoName: videoName || existingRecord?.videoName,
    mediaType: (videoBlob || existingRecord?.videoBlob) ? 'video' : mediaType,
  };

  await db.put(STORE_NAME, record);

  // Automatically re-index and sync checklist if saving a specimen to keep set contiguous
  if (!isChecklist) {
    await reindexArchiveCards();
  }

  return record;
}

export async function getAllArchiveCards(): Promise<ArchiveCardRecord[]> {
  const db = await initArchiveDB();
  const all = await db.getAll(STORE_NAME);

  const checklistCards = all.filter(c => 
    c.encounter?.card_number === 0 || 
    c.encounter?.card_type === 'checklist' || 
    c.imageName.includes('checklist')
  );

  // Prioritize video-enabled checklist, then newest
  checklistCards.sort((a, b) => (b.videoBlob ? 1 : 0) - (a.videoBlob ? 1 : 0) || b.createdAt - a.createdAt);
  const checklist = checklistCards[0];

  const specimens = all
    .filter(c => !checklistCards.some(chk => chk.id === c.id) && c.encounter?.card_number !== 0 && c.encounter?.card_type !== 'checklist')
    .sort((a, b) => (a.encounter?.card_number || 0) - (b.encounter?.card_number || 0));

  return checklist ? [checklist, ...specimens] : specimens;
}

export async function deleteCardFromArchive(id: string): Promise<void> {
  const db = await initArchiveDB();
  await db.delete(STORE_NAME, id);
  // Auto re-index and sync checklist after delete so vacancies shift down smoothly
  await reindexArchiveCards();
}