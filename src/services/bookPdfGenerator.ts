import { jsPDF } from 'jspdf';
import { ArchiveCardRecord } from '../utils/archiveDb';
import { CombatEncounter, CardThemeType } from '../types';

export interface BookOptions {
  title?: string;
  investigatorName?: string;
  suburbSector?: string;
  format?: 'letter' | 'a4';
  orientation?: 'portrait' | 'landscape';
  bookType?: 'binder-album' | 'dossier-compendium' | 'deluxe-edition' | 'current-sheet';
  sheetTheme?: 'polypropylene' | 'clean-print';
  includeCover?: boolean;
  includeIndex?: boolean;
  includeBackCover?: boolean;
  currentSheetNumber?: number;
  totalCardsPerPage?: number;
}

export interface ProgressCallback {
  (status: string, percentage: number): void;
}

const CARDS_PER_SHEET = 9;

export async function createCoverCanvas(
  cards: (ArchiveCardRecord & { previewUrl: string })[],
  options: BookOptions
): Promise<string> {
  const width = 1600;
  const height = 2070;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c071d');
  bgGrad.addColorStop(0.35, '#16092b');
  bgGrad.addColorStop(0.7, '#081726');
  bgGrad.addColorStop(1, '#05030a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, 90, height);
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(90, 0);
  ctx.lineTo(90, height);
  ctx.stroke();

  [height * 0.22, height * 0.5, height * 0.78].forEach((ry) => {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(45, ry, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 4;
    ctx.stroke();
  });

  ctx.strokeStyle = '#FF007F';
  ctx.lineWidth = 6;
  ctx.strokeRect(120, 50, width - 170, height - 100);

  ctx.fillStyle = '#FF007F';
  ctx.fillRect(132, 62, width - 194, 54);
  ctx.fillStyle = '#000000';
  ctx.font = '900 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TOP SECRET // SUBURBAN PHENOMENA INVESTIGATION DIVISION // CLASSIFIED EYES ONLY', (width + 70) / 2, 95);

  const titleY = 320;
  ctx.fillStyle = '#000000';
  ctx.font = '900 108px sans-serif';
  ctx.fillText('TRAPPER KEEPER', width / 2 + 35, titleY + 8);

  const titleGrad = ctx.createLinearGradient(width * 0.2, titleY - 70, width * 0.8, titleY + 20);
  titleGrad.addColorStop(0, '#FF007F');
  titleGrad.addColorStop(0.4, '#FFE600');
  titleGrad.addColorStop(0.8, '#00F0FF');
  titleGrad.addColorStop(1, '#A855F7');
  ctx.fillStyle = titleGrad;
  ctx.fillText('TRAPPER KEEPER', width / 2 + 30, titleY);

  const metaY = height - 340;
  ctx.fillStyle = '#121217';
  ctx.fillRect(160, metaY, width - 230, 240);
  ctx.strokeStyle = '#FF007F';
  ctx.lineWidth = 3;
  ctx.strokeRect(160, metaY, width - 230, 240);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#00F0FF';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('FIELD INVESTIGATOR LOG:', 190, metaY + 45);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText(`OPERATIVE: ${options.investigatorName || 'OFFICER DALE HENDERSON & CREW'}`, 190, metaY + 85);
  ctx.fillText(`SECTOR: ${options.suburbSector || 'EAST COAST SUBURBAN PERIMETER 199X'}`, 190, metaY + 118);
  ctx.fillText(`TOTAL CATALOGED SPECIMENS: ${cards.length} CARDS`, 190, metaY + 151);

  drawBarcode(ctx, width - 380, metaY + 45, 260, 90);
  return canvas.toDataURL('image/jpeg', 0.94);
}

export async function createIndexCanvas(
  cards: (ArchiveCardRecord & { previewUrl: string })[],
  options: BookOptions
): Promise<string> {
  const width = 1600;
  const height = 2070;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.fillStyle = '#09090d';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#040407';
  ctx.fillRect(0, 0, 90, height);
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 90, height);

  [height * 0.22, height * 0.5, height * 0.78].forEach((ry) => {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(45, ry, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 4;
  ctx.strokeRect(120, 50, width - 170, height - 100);

  ctx.fillStyle = '#18181b';
  ctx.fillRect(130, 60, width - 190, 110);
  ctx.fillStyle = '#00F0FF';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ANOMALY INDEX // TACTICAL FIELD ROSTER', 160, 115);

  const tableTop = 200;
  const rowHeight = 65;
  ctx.fillStyle = '#27272a';
  ctx.fillRect(140, tableTop, width - 210, 45);
  ctx.fillStyle = '#FFE600';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('#', 160, tableTop + 29);
  ctx.fillText('ENTITY CODENAME', 215, tableTop + 29);
  ctx.fillText('STATUS AFFLICTION', 600, tableTop + 29);
  ctx.fillText('IMPROVISED LOADOUT', 930, tableTop + 29);
  ctx.fillText('SHEET #', 1340, tableTop + 29);
  ctx.fillText('POCKET', 1450, tableTop + 29);

  const displayItems = cards.slice(0, 24);
  displayItems.forEach((card, index) => {
    const y = tableTop + 55 + index * rowHeight;
    const isEven = index % 2 === 0;
    ctx.fillStyle = isEven ? 'rgba(24, 24, 27, 0.7)' : 'rgba(9, 9, 11, 0.9)';
    ctx.fillRect(140, y, width - 210, rowHeight - 6);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.strokeRect(140, y, width - 210, rowHeight - 6);

    const cardNum = card.encounter.card_number ?? index;
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(String(cardNum).padStart(2, '0'), 160, y + 36);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    let name = card.encounter.entity_name || 'Suburban Entity';
    while (ctx.measureText(name).width > 365 && name.length > 5) {
      name = name.slice(0, -2) + '…';
    }
    ctx.fillText(name, 215, y + 36);

    const threatColor = card.encounter.threat_level_color || '#FF007F';
    ctx.fillStyle = threatColor;
    ctx.font = 'bold 14px monospace';
    let status = card.encounter.status_affliction || 'SECURED';
    while (ctx.measureText(status).width > 290 && status.length > 5) {
      status = status.slice(0, -2) + '…';
    }
    ctx.fillText(status, 600, y + 35);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px monospace';
    let weapon = card.encounter.protagonist_loadout?.improvised_weapon || 'Defective Gear';
    while (ctx.measureText(weapon).width > 380 && weapon.length > 5) {
      weapon = weapon.slice(0, -2) + '…';
    }
    ctx.fillText(weapon, 930, y + 35);

    const sheetNum = Math.floor(index / CARDS_PER_SHEET) + 1;
    const pocketNum = (index % CARDS_PER_SHEET) + 1;
    ctx.fillStyle = '#FF007F';
    ctx.fillText(`SHEET ${sheetNum}`, 1340, y + 35);
    ctx.fillStyle = '#00F0FF';
    ctx.fillText(`SLOT ${pocketNum}`, 1450, y + 35);
  });

  return canvas.toDataURL('image/jpeg', 0.94);
}

export async function createBinderSheetCanvas(
  sheetCards: (ArchiveCardRecord & { previewUrl: string })[],
  sheetNumber: number,
  totalSheets: number,
  totalArchiveCards: number,
  sheetTheme: 'polypropylene' | 'clean-print' = 'polypropylene'
): Promise<string> {
  const width = 1600;
  const height = 2070;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c0d15');
  bgGrad.addColorStop(0.4, '#111320');
  bgGrad.addColorStop(0.8, '#0e101a');
  bgGrad.addColorStop(1, '#08090e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 0, 90, height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(90, 0);
  ctx.lineTo(90, height);
  ctx.stroke();

  [height * 0.22, height * 0.5, height * 0.78].forEach((ry) => {
    ctx.fillStyle = '#030406';
    ctx.beginPath();
    ctx.arc(45, ry, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(24, 26, 38, 0.85)';
  ctx.fillRect(110, 42, width - 150, 72);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(110, 42, width - 150, 72);

  ctx.fillStyle = '#FF007F';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`199X ARCHIVAL POLYPROPYLENE // 9-POCKET SHEET #${String(sheetNumber).padStart(2, '0')}`, 140, 85);
  ctx.fillStyle = '#00F0FF';
  ctx.textAlign = 'right';
  ctx.fillText(`SHEET ${sheetNumber} OF ${totalSheets}  •  ${totalArchiveCards} TOTAL SPECIMENS`, width - 70, 85);

  const gridStartX = 110;
  const gridStartY = 135;
  const gridW = width - 150;
  const gridH = height - 170;
  const cols = 3;
  const rows = 3;
  const paddingX = 22;
  const paddingY = 22;
  const slotW = (gridW - paddingX * (cols - 1)) / cols;
  const slotH = (gridH - paddingY * (rows - 1)) / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const slotIndex = row * cols + col;
      const card = sheetCards[slotIndex];
      const slotX = gridStartX + col * (slotW + paddingX);
      const slotY = gridStartY + row * (slotH + paddingY);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.fillRect(slotX, slotY, slotW, slotH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(slotX, slotY, slotW, slotH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`TOP-LOAD POCKET #${String(slotIndex + 1).padStart(2, '0')}`, slotX + 16, slotY + 17);

      if (card) {
        await drawCardInSleeve(ctx, card, slotX + 11, slotY + 26, slotW - 22, slotH - 34, card.encounter.card_number ?? slotIndex);
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(slotX + 16, slotY + 32, slotW - 32, slotH - 48);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ ULTRA-PRO SLEEVE ]', slotX + slotW / 2, slotY + slotH / 2 - 12);
        ctx.font = '14px monospace';
        ctx.fillText(`POCKET #${String(slotIndex + 1).padStart(2, '0')} VACANT`, slotX + slotW / 2, slotY + slotH / 2 + 16);
      }
    }
  }

  return canvas.toDataURL('image/jpeg', 0.94);
}

export async function generateSingleSheetPdf(
  sheetCards: (ArchiveCardRecord & { previewUrl: string })[],
  sheetNumber: number,
  totalSheets: number,
  totalArchiveCards: number,
  theme: 'polypropylene' | 'clean-print' = 'polypropylene',
  format: 'letter' | 'a4' = 'letter'
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const sheetDataUrl = await createBinderSheetCanvas(sheetCards, sheetNumber, totalSheets, totalArchiveCards, theme);
  doc.addImage(sheetDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  return doc.output('blob');
}

async function drawChecklistCardInSleeve(
  ctx: CanvasRenderingContext2D,
  card: ArchiveCardRecord & { previewUrl: string },
  x: number,
  y: number,
  w: number,
  h: number,
  cardNum: number
) {
  const items = card.encounter.checklist_items || [];
  ctx.save();
  ctx.fillStyle = '#060812';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#FFE600';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

  ctx.fillStyle = '#FFE600';
  ctx.fillRect(x + 4, y + 4, w - 8, 46);
  ctx.fillStyle = '#000000';
  ctx.font = '900 11.5px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('★ 199X MASTER CHECKLIST', x + 10, y + 20);
  ctx.font = '900 14px sans-serif';
  ctx.fillText('199X SERIES 2 MASTER CHECKLIST', x + 10, y + 38);

  const gridY = y + 54;
  const gridH = h - 90;
  ctx.fillStyle = '#0a0e1c';
  ctx.fillRect(x + 6, gridY, w - 12, gridH);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('COLLECTED SPECIMENS REGISTER', x + 12, gridY + 18);

  const maxItems = Math.min(items.length, 12);
  const rowH = (gridH - 30) / Math.max(1, maxItems);
  for (let i = 0; i < maxItems; i++) {
    const itm = items[i];
    const iy = gridY + 36 + i * rowH;
    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 10.5px monospace';
    ctx.fillText(`☑ #${String(itm.number).padStart(2, '0')}`, x + 12, iy);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10.5px sans-serif';
    let nm = itm.name;
    while (ctx.measureText(nm).width > w - 110 && nm.length > 5) {
      nm = nm.slice(0, -2) + '…';
    }
    ctx.fillText(nm, x + 50, iy);
  }

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 4, y + h - 32, w - 8, 28);
  ctx.fillStyle = '#FFE600';
  ctx.font = '900 10px monospace';
  ctx.fillText('54 SPECIMEN REGISTER (CARD #00 ANCHOR)', x + 10, y + h - 14);
  ctx.restore();
}

async function drawCardInSleeve(
  ctx: CanvasRenderingContext2D,
  card: ArchiveCardRecord & { previewUrl: string },
  x: number,
  y: number,
  w: number,
  h: number,
  cardNum: number
) {
  const encounter = card.encounter;
  if (encounter.card_type === 'checklist' || cardNum === 0) {
    return drawChecklistCardInSleeve(ctx, card, x, y, w, h, 0);
  }

  const threatColor = encounter.threat_level_color || '#FF007F';
  const rawTheme = (typeof window !== 'undefined' 
    ? localStorage.getItem('199x_global_card_theme') 
    : null) || encounter.card_theme || 'memphis-rad';

  ctx.save();

  // 1. RENDER UNIFIED 1990S BACKGROUND CHASSIS
  if (rawTheme === 'memphis-rad') {
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ff007f';
    for (let py = y + 10; py < y + h; py += 28) {
      for (let px = x + 10; px < x + w; px += 28) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#ffe600';
    for (let py = y + 24; py < y + h; py += 28) {
      for (let px = x + 24; px < x + w; px += 28) {
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }
  } else if (rawTheme === 'cyber-pcb') {
    ctx.fillStyle = '#042217';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1.5;
    for (let lx = x + 15; lx < x + w; lx += 25) {
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + h);
      ctx.stroke();
    }
  } else if (rawTheme === 'cracked-ice') {
    ctx.fillStyle = '#071927';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    for (let di = -h; di < w + h; di += 28) {
      ctx.beginPath();
      ctx.moveTo(x + di, y);
      ctx.lineTo(x + di + h * 0.5, y + h);
      ctx.stroke();
    }
  } else if (rawTheme === 'synthwave-grid') {
    ctx.fillStyle = '#0c051a';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let gy = y; gy < y + h; gy += 16) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
  } else if (rawTheme === 'atomic-purple') {
    ctx.fillStyle = '#4b0082';
    ctx.fillRect(x, y, w, h);
  } else {
    ctx.fillStyle = '#070a14';
    ctx.fillRect(x, y, w, h);
  }

  // Outer Border & Threat Rim
  ctx.strokeStyle = threatColor;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

  // 2. TOP NAMEPLATE BANNER
  const headerH = 46;
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 4, y + 4, w - 8, headerH);
  ctx.fillStyle = '#FFE600';
  ctx.fillRect(x + 4, y + 4, w - 8, 3.5);

  ctx.fillStyle = '#00F0FF';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SERIES 2 #${String(cardNum).padStart(2, '0')}`, x + 10, y + 22);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 16px sans-serif';
  let displayName = encounter.entity_name || 'Suburban Entity';
  while (ctx.measureText(displayName).width > w - 110 && displayName.length > 5) {
    displayName = displayName.slice(0, -2) + '…';
  }
  ctx.fillText(displayName, x + 10, y + 42);

  // Threat Badge Pill
  ctx.fillStyle = threatColor;
  ctx.fillRect(x + w - 78, y + 13, 68, 24);
  ctx.fillStyle = '#000000';
  ctx.font = '900 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(encounter.critical_smash ? 'CRITICAL' : 'THREAT', x + w - 44, y + 29);

  // 3. ARTWORK APERTURE
  const artY = y + headerH + 6;
  const artH = Math.round(h * 0.48);
  const artW = w - 12;
  const artX = x + 6;
  try {
    const img = await loadImage(card.previewUrl);
    ctx.drawImage(img, artX, artY, artW, artH);
  } catch {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(artX, artY, artW, artH);
  }
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(artX, artY, artW, artH);

  // 4. STATS & DOSSIER PANEL
  const statsY = artY + artH + 6;
  const statsH = h - (statsY - y) - 6;
  ctx.fillStyle = 'rgba(9, 13, 25, 0.92)';
  ctx.fillRect(artX, statsY, artW, statsH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(artX, statsY, artW, statsH);

  // Header Strip
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(artX + 1, statsY + 1, artW - 2, 28);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('FIELD DOSSIER // RECON', artX + 8, statsY + 19);

  // Field Dossier Narrative Clamped to 3 Lines
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 13.5px system-ui, sans-serif';
  const bioLines = wrapText(ctx, encounter.cosmic_distortion || 'Anomalous suburban presence secured.', artW - 16, 3);
  bioLines.forEach((line, li) => {
    ctx.fillText(line, artX + 8, statsY + 46 + li * 20);
  });

  // Improvised Gear
  const intelY = statsY + 110;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('GEAR: ', artX + 8, intelY + 14);
  ctx.fillStyle = '#ffffff';
  let gearText = encounter.protagonist_loadout?.improvised_weapon || 'Standard Tool';
  if (gearText.length > 22) gearText = gearText.slice(0, 20) + '…';
  ctx.fillText(gearText, artX + 54, intelY + 14);

  // Dynamic Impel Power Ratings
  const stats = (encounter as any).impel_ratings || { strength: 5, speed: 4, energy: 6, psychic: 7 };
  const pipsY = statsY + statsH - 26;
  drawMiniStatPips(ctx, artX + 8, pipsY, 'STR', stats.strength);
  drawMiniStatPips(ctx, artX + 98, pipsY, 'SPD', stats.speed);
  drawMiniStatPips(ctx, artX + 188, pipsY, 'ENG', stats.energy);
  drawMiniStatPips(ctx, artX + 278, pipsY, 'PSY', stats.psychic);

  ctx.restore();
}

function drawMiniStatPips(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, val: number) {
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y + 10);
  const startPips = x + 30;
  for (let p = 1; p <= 7; p++) {
    const px = startPips + (p - 1) * 8;
    ctx.fillStyle = p <= val ? '#FFE600' : '#1e293b';
    ctx.fillRect(px, y + 1, 6, 11);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, y + 1, 6, 11);
  }
}

export async function createCardDossierSpreadCanvas(
  card: ArchiveCardRecord & { previewUrl: string },
  cardIndex: number,
  options: BookOptions
): Promise<string> {
  const width = 1600;
  const height = 2070;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const encounter = card.encounter;
  const threatColor = encounter.threat_level_color || '#FF007F';

  ctx.fillStyle = '#090a10';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = threatColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(120, 50, width - 170, height - 100);

  ctx.fillStyle = '#111827';
  ctx.fillRect(130, 60, width - 190, 80);
  ctx.fillStyle = '#FFE600';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`CLASSIFIED ENCOUNTER DOSSIER // SPECIMEN #${String(card.encounter.card_number ?? cardIndex + 1).padStart(2, '0')}`, 160, 98);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.fillText(encounter.entity_name || 'Suburban Entity', 160, 128);

  const artW = 680;
  const artH = 680;
  const artX = 145;
  const artY = 160;
  try {
    const img = await loadImage(card.previewUrl);
    ctx.drawImage(img, artX, artY, artW, artH);
  } catch {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(artX, artY, artW, artH);
  }
  ctx.strokeStyle = threatColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(artX, artY, artW, artH);

  const sideX = artX + artW + 35;
  const sideW = width - sideX - 65;
  ctx.fillStyle = '#111827';
  ctx.fillRect(sideX, artY, sideW, artH);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.strokeRect(sideX, artY, sideW, artH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('SUBURBAN COMBAT LOG //', sideX + 24, artY + 45);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('IMPROVISED WEAPON:', sideX + 24, artY + 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(encounter.protagonist_loadout?.improvised_weapon || 'Standard Tool', sideX + 24, artY + 115);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('NOSTALGIA ARTIFACT:', sideX + 24, artY + 160);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(encounter.protagonist_loadout?.nostalgia_artifact || 'Vintage Relic', sideX + 24, artY + 185);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('SYNERGY EFFECT:', sideX + 24, artY + 230);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(encounter.protagonist_loadout?.weird_synergy_effect || 'Resonant Energy Burst', sideX + 24, artY + 255);

  const stats = (encounter as any).impel_ratings || { strength: 6, speed: 5, energy: 7, psychic: 6 };
  const powerY = artY + 480;
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(sideX + 16, powerY, sideW - 32, 175);
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 2;
  ctx.strokeRect(sideX + 16, powerY, sideW - 32, 175);
  ctx.fillStyle = '#f472b6';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('IMPEL POWER MATRIX (1-7 SCALE)', sideX + 35, powerY + 35);
  drawLargeStatBar(ctx, sideX + 35, powerY + 55, 'STRENGTH', stats.strength);
  drawLargeStatBar(ctx, sideX + 35, powerY + 85, 'SPEED', stats.speed);
  drawLargeStatBar(ctx, sideX + 35, powerY + 115, 'ENERGY', stats.energy);
  drawLargeStatBar(ctx, sideX + 35, powerY + 145, 'PSYCHIC', stats.psychic);

  const bioY = artY + artH + 30;
  const bioH = height - bioY - 90;
  ctx.fillStyle = '#111827';
  ctx.fillRect(145, bioY, width - 210, bioH);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.strokeRect(145, bioY, width - 210, bioH);

  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(145, bioY, width - 210, 48);
  ctx.fillStyle = '#000000';
  ctx.font = '900 22px monospace';
  ctx.fillText(`FIELD DOSSIER NARRATIVE // SPECIMEN #${String(card.encounter.card_number ?? cardIndex + 1).padStart(2, '0')}`, 170, bioY + 32);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const wrappedBio = wrapText(ctx, encounter.cosmic_distortion || 'Anomalous suburban presence secured.', width - 270, 4);
  wrappedBio.forEach((line, idx) => {
    ctx.fillText(line, 175, bioY + 95 + idx * 34);
  });

  return canvas.toDataURL('image/jpeg', 0.94);
}

function drawLargeStatBar(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: number) {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y + 14);
  const blockStart = x + 120;
  for (let i = 1; i <= 7; i++) {
    const bx = blockStart + (i - 1) * 28;
    ctx.fillStyle = i <= value ? '#facc15' : '#334155';
    ctx.fillRect(bx, y, 22, 18);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, y, 22, 18);
  }
}

export async function createBackCoverCanvas(totalCards: number, options: BookOptions): Promise<string> {
  const width = 1600;
  const height = 2070;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#05030a');
  bg.addColorStop(0.5, '#120b22');
  bg.addColorStop(1, '#080d1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#050508';
  ctx.fillRect(width - 90, 0, 90, height);
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 90, 0);
  ctx.lineTo(width - 90, height);
  ctx.stroke();

  const midX = (width - 120) / 2 + 30;
  ctx.fillStyle = '#FF007F';
  ctx.font = '900 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRAPPER KEEPER', midX, 320);

  ctx.fillStyle = '#111827';
  ctx.fillRect(150, 460, width - 370, 1000);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.strokeRect(150, 460, width - 370, 1000);
  ctx.fillStyle = '#FFE600';
  ctx.font = 'bold 26px monospace';
  ctx.fillText("ARCHIVAL COLLECTOR'S CHECKLIST", midX, 520);

  const checkX = 220;
  const checkY = 620;
  for (let i = 0; i < 12; i++) {
    const cx = checkX + (i % 2) * 540;
    const cy = checkY + Math.floor(i / 2) * 65;
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, 26, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SERIES 2 #${String(i + 1).padStart(2, '0')} 199X SPECIMEN`, cx + 45, cy + 20);
  }

  drawBarcode(ctx, midX - 160, 1540, 320, 110);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ISBN 0-199X-ROGUE-01', midX, 1690);

  return canvas.toDataURL('image/jpeg', 0.94);
}

export async function generateBookPdf(
  cards: (ArchiveCardRecord & { previewUrl: string })[],
  options: BookOptions,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const format = options.format || 'letter';
  const orientation = options.orientation || 'portrait';
  const bookType = options.bookType || 'binder-album';

  const doc = new jsPDF({ orientation, unit: 'pt', format });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalSheets = Math.max(1, Math.ceil(cards.length / CARDS_PER_SHEET));
  let isFirstPage = true;

  const addImagePage = (imgDataUrl: string) => {
    if (!isFirstPage) {
      doc.addPage(format, orientation);
    }
    isFirstPage = false;
    doc.addImage(imgDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  };

  if (options.includeCover !== false && bookType !== 'current-sheet') {
    onProgress?.('Generating Trapper Keeper Retro Cover...', 10);
    const coverData = await createCoverCanvas(cards, options);
    addImagePage(coverData);
  }

  if (options.includeIndex !== false && bookType !== 'current-sheet' && cards.length > 0) {
    onProgress?.('Generating Anomaly Roster & Index...', 25);
    const indexData = await createIndexCanvas(cards, options);
    addImagePage(indexData);
  }

  if (bookType === 'binder-album' || bookType === 'deluxe-edition') {
    for (let s = 1; s <= totalSheets; s++) {
      const pct = 30 + Math.round((s / totalSheets) * 35);
      onProgress?.(`Rendering 9-Pocket Binder Sheet ${s} of ${totalSheets}...`, pct);
      const sheetCards = cards.slice((s - 1) * CARDS_PER_SHEET, s * CARDS_PER_SHEET);
      const sheetData = await createBinderSheetCanvas(sheetCards, s, totalSheets, cards.length, options.sheetTheme || 'polypropylene');
      addImagePage(sheetData);
    }
  } else if (bookType === 'current-sheet') {
    const currentSheet = options.currentSheetNumber || 1;
    onProgress?.(`Rendering 9-Pocket Sheet #${currentSheet}...`, 50);
    const sheetCards = cards.slice((currentSheet - 1) * CARDS_PER_SHEET, currentSheet * CARDS_PER_SHEET);
    const sheetData = await createBinderSheetCanvas(sheetCards, currentSheet, totalSheets, cards.length, options.sheetTheme || 'polypropylene');
    addImagePage(sheetData);
  }

  if (bookType === 'dossier-compendium' || bookType === 'deluxe-edition') {
    const totalDossiers = cards.length;
    for (let i = 0; i < totalDossiers; i++) {
      const pct = 65 + Math.round((i / Math.max(1, totalDossiers)) * 25);
      onProgress?.(`Generating Dossier Page ${i + 1} of ${totalDossiers}...`, pct);
      const dossierData = await createCardDossierSpreadCanvas(cards[i], i, options);
      addImagePage(dossierData);
    }
  }

  if (options.includeBackCover !== false && bookType !== 'current-sheet') {
    onProgress?.('Generating Archival Back Cover...', 95);
    const backCoverData = await createBackCoverCanvas(cards.length, options);
    addImagePage(backCoverData);
  }

  onProgress?.('Binding PDF Book...', 100);
  return doc.output('blob');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number = 10): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#000000';
  let curX = x + 10;
  const barPattern = [2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2];
  let pIdx = 0;
  while (curX < x + w - 15) {
    const barW = barPattern[pIdx % barPattern.length];
    ctx.fillRect(curX, y + 8, barW, h - 16);
    curX += barW + (pIdx % 3 === 0 ? 3 : 2);
    pIdx++;
  }
}