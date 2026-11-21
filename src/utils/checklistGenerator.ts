import { CombatEncounter, ChecklistItem } from '../types';
import { ArchiveCardRecord } from './archiveDb';

/**
 * Generates an authentic 1990s Impel / SkyBox style high-resolution artwork canvas
 * for the front of the Checklist Card, returning a PNG Blob.
 */
export async function renderChecklistFrontCanvasBlob(
  title: string,
  cardNumber: number,
  items: ChecklistItem[]
): Promise<Blob> {
  const width = 840;
  const height = 1176; // 5:7 aspect ratio (standard 2.5 x 3.5 trading card ratio at 300 DPI)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Background - Deep 1990s cosmic obsidian with retro grid
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#090d16');
  bg.addColorStop(0.4, '#131b2e');
  bg.addColorStop(0.8, '#0b101d');
  bg.addColorStop(1, '#05070c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle perspective neon grid lines at bottom
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 1.5;
  const gridY = height * 0.72;
  for (let y = gridY; y <= height; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let x = -width; x <= width * 2; x += 55) {
    ctx.beginPath();
    ctx.moveTo(width / 2 + (x - width / 2) * 0.18, gridY);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  // Outer Golden Foil Frame
  ctx.strokeStyle = '#FFE600';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Top Masthead Banner
  ctx.fillStyle = '#000000';
  ctx.fillRect(34, 34, width - 68, 70);
  ctx.fillStyle = '#FFE600';
  ctx.fillRect(34, 34, width - 68, 5);

  ctx.fillStyle = '#00F0FF';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('199X SUBURBAN ROGUELIKE', 48, 62);

  ctx.fillStyle = '#FFE600';
  ctx.font = '900 24px monospace';
  ctx.fillText('★ SERIES 1 OFFICIAL CHECKLIST ★', 48, 92);

  ctx.fillStyle = '#FFE600';
  ctx.fillRect(width - 150, 48, 102, 38);
  ctx.fillStyle = '#000000';
  ctx.font = '900 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`CARD #${String(cardNumber).padStart(2, '0')}`, width - 99, 73);

  // Subheader: Part 1 Indicator
  const midItems = Math.ceil(items.length / 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(34, 114, width - 68, 40);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 114, width - 68, 40);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`PART 1 OF 2 // SPECIMENS #01–#${String(midItems).padStart(2, '0')} ARCHIVAL REGISTER`, 48, 139);

  ctx.fillStyle = '#FFE600';
  ctx.textAlign = 'right';
  ctx.fillText(`[ ${items.length} TOTAL CARDS ]`, width - 48, 139);

  // Render 2 Columns of Checklist Items for the first half
  const col1X = 48;
  const col2X = width / 2 + 10;
  const colW = width / 2 - 58;
  const startY = 175;
  const rowH = 31;
  const itemsPerCol = Math.ceil(midItems / 2);

  for (let i = 0; i < midItems; i++) {
    const item = items[i];
    if (!item) continue;
    const isCol2 = i >= itemsPerCol;
    const colIdx = isCol2 ? i - itemsPerCol : i;
    const x = isCol2 ? col2X : col1X;
    const y = startY + colIdx * rowH;

    // Checkbox Box
    ctx.fillStyle = item.checked !== false ? '#FFE600' : 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(x, y, 18, 18);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, 18, 18);

    if (item.checked !== false) {
      ctx.fillStyle = '#000000';
      ctx.font = '900 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('✓', x + 9, y + 14);
    }

    // Number & Name
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`#${String(item.number).padStart(2, '0')}`, x + 26, y + 14);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13.5px system-ui, -apple-system, sans-serif';
    let name = item.name;
    while (ctx.measureText(name).width > colW - 85 && name.length > 4) {
      name = name.slice(0, -2) + '…';
    }
    ctx.fillText(name, x + 60, y + 14);

    // Rarity Dot
    ctx.fillStyle = item.rarity === 'prism' ? '#bd00ff' : item.rarity === 'gold' ? '#FFE600' : item.rarity === 'silver' ? '#e2e8f0' : '#FF007F';
    ctx.beginPath();
    ctx.arc(x + colW - 10, y + 9, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom Notice: Flip for Part 2
  const footerY = height - 105;
  ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
  ctx.fillRect(34, footerY, width - 68, 55);
  ctx.strokeStyle = '#FFE600';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(34, footerY, width - 68, 55);

  ctx.fillStyle = '#FFE600';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`★ SPECIMENS #01–#${String(midItems).padStart(2, '0')} SECURED • FLIP CARD FOR SPECIMENS #${String(midItems + 1).padStart(2, '0')}+ ★`, width / 2, footerY + 25);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '11px monospace';
  ctx.fillText('AUTHENTIC 199X IMPEL / SKYBOX ARCHIVAL SERIES 1 MASTER CHECKLIST', width / 2, footerY + 44);

  // Bottom Copyright Strip
  ctx.fillStyle = '#71717a';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('© 199X SUBURBAN ROGUELIKE • ALL ANOMALIES SECURED IN TRAPPER KEEPER ALBUM', width / 2, height - 24);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([], { type: 'image/png' }));
    }, 'image/png');
  });
}

/**
 * Builds the complete Checklist Card record from all existing archive cards.
 */
export async function buildChecklistCard(
  savedCards: ArchiveCardRecord[],
  targetCardNumber?: number,
  customTitle?: string
): Promise<{ encounter: CombatEncounter; imageBlob: Blob; imageName: string }> {
  // Sort cards chronologically (oldest = #01)
  const sorted = [...savedCards].reverse();

  const finalNumber = targetCardNumber || Math.max(savedCards.length + 1, 54);
  const items: ChecklistItem[] = [];

  // Build entries for existing cards
  sorted.forEach((card, idx) => {
    const num = card.encounter.card_number || (idx + 1);
    items.push({
      number: num,
      name: card.encounter.entity_name || `Specimen #${num}`,
      checked: true,
      rarity: card.encounter.card_foil_rarity || (card.encounter.is_foil ? 'gold' : 'standard'),
      threatColor: card.encounter.threat_level_color || '#FF007F',
      status: card.encounter.status_affliction || 'SECURED'
    });
  });

  // If there are unfilled slots leading up to the finalNumber, pad them nicely
  const existingCount = items.length;
  if (existingCount < finalNumber - 1) {
    for (let p = existingCount + 1; p < finalNumber; p++) {
      items.push({
        number: p,
        name: `Suburban Phenomenon #${p}`,
        checked: false,
        rarity: 'standard',
        threatColor: '#38bdf8',
        status: 'UNVERIFIED'
      });
    }
  }

  // The checklist card itself is the final entry!
  const checklistTitle = customTitle || 'Series 1 Master Checklist';
  items.push({
    number: finalNumber,
    name: checklistTitle,
    checked: true,
    rarity: 'gold',
    threatColor: '#FFE600',
    status: 'COMPLETE'
  });

  const imageBlob = await renderChecklistFrontCanvasBlob(checklistTitle, finalNumber, items);

  const encounter: CombatEncounter = {
    entity_name: checklistTitle,
    cosmic_distortion: `Official 199X Series 1 Master Checklist certifying ${finalNumber} anomalous suburban phenomena secured across 6 Trapper Keeper binder sheets.`,
    threat_level_color: '#FFE600',
    card_type: 'checklist',
    card_number: finalNumber,
    is_foil: true,
    card_foil_rarity: 'gold',
    card_theme: 'gold-embossed',
    checklist_items: items,
    checklist_subtitle: `SUBURBAN ROGUELIKE ARCHIVE • ${finalNumber} CARDS TOTAL`,
    protagonist_loadout: {
      improvised_weapon: 'Ultra PRO 3-Ring Binder',
      nostalgia_artifact: 'Gold Archival Checklist Pen',
      weird_synergy_effect: '100% Series 1 Archival Completion'
    },
    combat_ticker: [
      `All ${finalNumber} suburban anomalies indexed and verified in Trapper Keeper.`,
      `Series 1 checklist certified by Division Archivist.`
    ],
    status_affliction: '100% SECURED',
    critical_smash: true,
    visual_generation_prompt: '1990s retro trading card checklist card with neon cyber grid, golden foil embossing, and checkboxes',
    video_generation_prompt: 'Cinematic slow zoom into a gold-foil 1990s trading card checklist in a retro binder',
    visual_style: '1990s Impel/SkyBox Prismatic Gold Checklist Card'
  };

  return {
    encounter,
    imageBlob,
    imageName: `checklist_card_${finalNumber}.png`
  };
}

/**
 * Synthesizes an authentic 1990s 3.5-second looping WebM VHS video reel for the Master Checklist (Card #00).
 * Captures animated CRT scanlines, golden metallic grid, SMPTE test pattern, and specimen registry ticker.
 */
export async function generateMasterChecklistVideoBlob(
  title: string = 'Series 2 Master Checklist',
  totalSpecimens: number = 53
): Promise<Blob> {
  const width = 640;
  const height = 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Check if MediaRecorder is supported
  if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
    return new Blob([], { type: 'video/webm' });
  }

  const stream = canvas.captureStream(24);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  recorder.start();

  const fps = 24;
  const durationSec = 3.5;
  const totalFrames = Math.floor(fps * durationSec);

  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;

    // Background
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#070b14');
    bg.addColorStop(0.5, '#111827');
    bg.addColorStop(1, '#05070d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Dynamic grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.5;
    const gridOffset = (f * 3) % 24;
    for (let y = 0; y <= height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y + gridOffset);
      ctx.lineTo(width, y + gridOffset);
      ctx.stroke();
    }
    for (let x = 0; x <= width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.restore();

    // Golden Outer Border
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Inner Neon Border
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // Top Header Banner
    ctx.fillStyle = '#000000';
    ctx.fillRect(24, 24, width - 48, 64);
    ctx.fillStyle = '#FFE600';
    ctx.fillRect(24, 24, width - 48, 4);

    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('199X ARCHIVAL POLYPROPYLENE // MASTER TAPE', 36, 48);

    ctx.fillStyle = '#FFE600';
    ctx.font = '900 20px monospace';
    ctx.fillText(`★ ${title.toUpperCase()} ★`, 36, 74);

    ctx.fillStyle = '#FFE600';
    ctx.fillRect(width - 140, 34, 104, 44);
    ctx.fillStyle = '#000000';
    ctx.font = '900 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CARD #00', width - 88, 62);

    // Center SMPTE Bars
    const barWidth = (width - 64) / 7;
    const barColors = ['#f87171', '#34d399', '#60a5fa', '#facc15', '#22d3ee', '#c084fc', '#f8fafc'];
    const barY = 104;
    const barH = 46;
    for (let b = 0; b < 7; b++) {
      ctx.fillStyle = barColors[b];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(32 + b * barWidth, barY, barWidth, barH);
    }
    ctx.globalAlpha = 1.0;

    // Center Oscilloscope Waveform
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 32; x < width - 32; x += 4) {
      const angle = (x * 0.05) + (f * 0.2);
      const y = 196 + Math.sin(angle) * 16 + Math.cos(angle * 1.5) * 8;
      if (x === 32) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Central Telemetry Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(32, 230, width - 64, 155);
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(32, 230, width - 64, 155);

    ctx.fillStyle = '#FFE600';
    ctx.font = '900 17px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SERIES 2 KINETIC REGISTRY // VERIFIED', 48, 262);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`• ${totalSpecimens} SPECIMEN VIDEO REELS SYNCHRONIZED`, 48, 292);
    ctx.fillText('• SHEET 1, POCKET 01 PERMANENT CAPSTONE ANCHOR', 48, 318);
    ctx.fillText('• 60Hz NTSC STEREO TRACKING // 1:1 SLEEVE PARITY', 48, 344);

    // Live Frame and Audio Telemetry
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    const timecode = `00:00:0${Math.floor(t)}:${String(f % fps).padStart(2, '0')}`;
    ctx.fillText(`REC ● 24FPS [VHS-HQ]  TC ${timecode}`, 48, 368);

    // CRT Scanlines
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    for (let sl = 0; sl < height; sl += 3) {
      ctx.fillRect(0, sl, width, 1.5);
    }
    // VHS tracking glitch bar moving down
    const glitchY = (f * 10) % height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, glitchY, width, 10);
    ctx.restore();

    // Footer
    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★ 199X SUBURBAN ROGUELIKE ARCHIVE • ULTRA-PRO ACID FREE NO PVC ★', width / 2, height - 20);

    // Fast-yield to allow stream capture
    await new Promise((r) => setTimeout(r, 10));
  }

  recorder.stop();
  return recordingPromise;
}

/**
 * Generates an authentic 800x1120 canvas rasterization for Card #00 Series 2 Master Checklist.
 */
export async function generateChecklistCardCanvasBlob(
  encounter: CombatEncounter,
  cardNumber: number,
  items: ChecklistItem[]
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.fillStyle = '#060814';
  ctx.fillRect(0, 0, 800, 1120);

  const goldGrad = ctx.createLinearGradient(0, 0, 800, 1120);
  goldGrad.addColorStop(0, '#FFE600');
  goldGrad.addColorStop(0.25, '#FFF275');
  goldGrad.addColorStop(0.5, '#D4AF37');
  goldGrad.addColorStop(0.75, '#FFE600');
  goldGrad.addColorStop(1, '#B8860B');
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, 780, 1100);

  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, 756, 1076);

  // Header Strip
  ctx.fillStyle = '#111827';
  ctx.fillRect(28, 28, 744, 46);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, 744, 46);

  ctx.fillStyle = '#FFE600';
  ctx.fillRect(36, 36, 170, 30);
  ctx.fillStyle = '#000000';
  ctx.font = '900 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ 199X CHECKLIST', 121, 56);

  ctx.fillStyle = '#00F0FF';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SERIES 2 • MASTER REGISTER', 220, 56);

  ctx.fillStyle = '#FFE600';
  ctx.fillRect(630, 36, 130, 30);
  ctx.fillStyle = '#000000';
  ctx.font = '900 15px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`CARD #00`, 695, 57);

  // Masthead Banner
  ctx.save();
  ctx.fillStyle = goldGrad;
  ctx.fillRect(28, 84, 744, 52);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 84, 744, 52);

  ctx.fillStyle = '#000000';
  ctx.font = '900 24px Impact, "Arial Black", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('COLLECTED SPECIMENS REGISTER', 42, 120);

  ctx.fillStyle = '#000000';
  ctx.fillRect(630, 92, 130, 34);
  ctx.fillStyle = '#FFE600';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${items.length} OF 53 SECURED`, 695, 114);
  ctx.restore();

  // Grid of strictly collected items
  const gridX = 28;
  const gridY = 146;
  const gridW = 744;
  const gridH = 860;
  ctx.fillStyle = '#0a0d1a';
  ctx.fillRect(gridX, gridY, gridW, gridH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(gridX, gridY, gridW, gridH);

  if (items.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NO SPECIMENS RECORDED YET', 400, 500);
    ctx.font = '14px monospace';
    ctx.fillText('Mount cards in your album to populate this master checklist!', 400, 535);
  } else {
    const colW = (gridW - 24) / 2;
    const col1X = gridX + 8;
    const col2X = gridX + colW + 16;
    const mid = Math.ceil(items.length / 2);
    const rowH = Math.min(54, Math.max(34, Math.floor((gridH - 24) / Math.max(1, mid))));

    items.forEach((itm, i) => {
      const isCol1 = i < mid;
      const colX = isCol1 ? col1X : col2X;
      const rIdx = isCol1 ? i : i - mid;
      const itemY = gridY + 16 + rIdx * rowH;

      ctx.fillStyle = 'rgba(255, 230, 0, 0.08)';
      ctx.fillRect(colX, itemY - 6, colW, rowH - 6);
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(colX, itemY - 6, colW, rowH - 6);

      // Checkbox
      ctx.fillStyle = '#FFE600';
      ctx.fillRect(colX + 8, itemY + (rowH - 30) / 2, 20, 20);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(colX + 8, itemY + (rowH - 30) / 2, 20, 20);
      ctx.fillStyle = '#000000';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', colX + 18, itemY + (rowH - 30) / 2 + 16);

      // Number #XX
      ctx.fillStyle = '#00F0FF';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`#${String(itm.number).padStart(2, '0')}`, colX + 36, itemY + (rowH - 30) / 2 + 15);

      // Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      let nm = itm.name;
      const maxW = colW - 100;
      while (ctx.measureText(nm).width > maxW && nm.length > 4) {
        nm = nm.slice(0, -2) + '…';
      }
      ctx.fillText(nm, colX + 82, itemY + (rowH - 30) / 2 + 15);
    });
  }

  // Footer Strip
  const footY = 1016;
  ctx.fillStyle = '#0a0d1a';
  ctx.fillRect(28, footY, 744, 76);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, footY, 744, 76);

  ctx.fillStyle = '#FFE600';
  ctx.font = '900 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ 54 SPECIMEN ARCHIVAL REGISTER (SHEET 1 POCKET 1 ANCHOR) ★', 400, footY + 34);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText('DYNAMIC LOG: AUTOMATICALLY GROWS AS YOU CAPTURE NEW ENTITIES', 400, footY + 54);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas rasterization failed'));
    }, 'image/png');
  });
}


