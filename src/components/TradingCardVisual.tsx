import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Film, 
  Volume2, 
  VolumeX, 
  Zap, 
  Barcode, 
  Layers, 
  FileText, 
  Palette, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Dices 
} from 'lucide-react';
import { CombatEncounter, CardThemeType, ChecklistItem, ImpelRatings } from '../types';
import { User } from 'firebase/auth';

export type { CardThemeType };

export const GLOBAL_THEME_STORAGE_KEY = '199x_global_card_theme';

export interface CardThemeMeta {
  id: CardThemeType;
  name: string;
  icon: string;
  tagline: string;
  badge: string;
  isLight?: boolean;
}

export const CARD_THEMES_CATALOG: CardThemeMeta[] = [
  { id: 'memphis-rad', name: 'Memphis Rad', icon: '📐', tagline: 'Neon MTV Geometrics', badge: 'RADICAL' },
  { id: 'atomic-purple', name: 'Atomic Purple', icon: '🟣', tagline: 'N64 Frosted Shell', badge: 'SEMI-CLEAR' },
  { id: 'laser-backdrop', name: 'School Photo Lasers', icon: '⚡', tagline: 'Lifetouch Neon Crossbeams', badge: 'PORTRAIT' },
  { id: 'gold-embossed', name: 'Fleer Ultra Gold', icon: '🏆', tagline: '24K Bullion Leafing', badge: 'EMBOSSED' },
  { id: 'toxic-ooze', name: 'Radioactive Ooze', icon: '🧪', tagline: 'Acid Biohazard Slime', badge: 'HAZMAT' },
  { id: 'cracked-ice', name: 'Cracked Ice', icon: '🧊', tagline: 'Pinnacle Prismatic Foil', badge: 'HOLO' },
  { id: 'cyber-pcb', name: '16-Bit Circuit', icon: '💾', tagline: 'Emerald PCB Motherboard', badge: 'SILICON' },
  { id: 'synthwave-grid', name: 'Synthwave Grid', icon: '🌆', tagline: 'Outrun Perspective Grid', badge: 'GRID' },
  { id: 'vintage-cardstock', name: 'Vintage Cardboard', icon: '📜', tagline: '199X Greyback Chipboard', badge: 'CLASSIC', isLight: true },
  { id: 'liquid-chrome', name: 'Liquid Chrome', icon: '🪞', tagline: 'Y2K Specular Mercury', badge: 'MIRROR' },
  { id: 'cosmic-nebula', name: 'Cosmic Nebula', icon: '🌌', tagline: 'SkyBox Deep Galaxy', badge: 'COSMIC' },
  { id: 'hypercolor-thermal', name: 'Hypercolor Heat', icon: '🌡️', tagline: 'Generra Thermochromic', badge: 'HEAT-SHIFT' },
  { id: 'vhs-static', name: 'VHS Tracking Glitch', icon: '📼', tagline: 'Analog Noise & Scanlines', badge: 'ANALOG' },
  { id: 'jazz-cup', name: "'90s Jazz Cup", icon: '🌊', tagline: '1991 Teal Solo Wave', badge: 'NOSTALGIA', isLight: true },
  { id: 'holo-diffraction', name: 'Holo Diffraction', icon: '🌈', tagline: 'Laser Rainbow Grating', badge: 'PRISM' }
];

// Unified Master Theme Engine: Guaranteed bold and distinct CSS for EVERY theme in the catalog
export function getThemeCardStyle(
  theme: CardThemeType, 
  threatColor: string = '#FF007F',
  isPrism: boolean = false,
  isGold: boolean = false,
  isSilver: boolean = false
): React.CSSProperties {
  let baseBg = '#09090b';
  let gradient = 'none';
  let bgSize: string | undefined;
  let bgPosition: string | undefined;
  let border = isPrism ? '3.5px solid #00f0ff' : isGold ? '3.5px solid #fbbf24' : isSilver ? '3.5px solid #e2e8f0' : `3.5px solid ${threatColor}`;
  let boxShadow = `0 10px 30px rgba(0,0,0,0.65), 0 0 20px ${threatColor}33`;

  switch (theme) {
    case 'memphis-rad':
      baseBg = '#00d2ff';
      gradient = [
        'radial-gradient(#ff007f 16%, transparent 17%)',
        'radial-gradient(#ffe600 16%, transparent 17%)',
        'repeating-linear-gradient(45deg, rgba(255, 0, 127, 0.15) 0px, rgba(255, 0, 127, 0.15) 4px, transparent 4px, transparent 16px)',
        'linear-gradient(135deg, #00f0ff 0%, #0099cc 100%)'
      ].join(', ');
      bgSize = '22px 22px, 22px 22px, auto, auto';
      bgPosition = '0 0, 11px 11px, 0 0, 0 0';
      border = isPrism ? '3.5px solid #ffffff' : '3.5px solid #ff007f';
      boxShadow = '0 10px 30px rgba(0,0,0,0.65), 0 0 20px rgba(0,240,255,0.5)';
      break;

    case 'atomic-purple':
      baseBg = '#2e0854';
      gradient = [
        'radial-gradient(circle at 50% 20%, rgba(192, 132, 252, 0.35) 0%, transparent 65%)',
        'linear-gradient(180deg, #3b0764 0%, #150328 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #00f0ff' : '3.5px solid #a855f7';
      boxShadow = '0 10px 30px rgba(46, 8, 84, 0.8), 0 0 25px rgba(168, 85, 247, 0.45)';
      break;

    case 'laser-backdrop':
      baseBg = '#050a24';
      gradient = [
        'linear-gradient(125deg, transparent 46%, rgba(255, 0, 127, 0.85) 48.5%, rgba(255, 180, 220, 0.95) 50%, rgba(255, 0, 127, 0.85) 51.5%, transparent 54%)',
        'linear-gradient(55deg, transparent 44%, rgba(0, 240, 255, 0.85) 47.5%, rgba(200, 250, 255, 0.95) 50%, rgba(0, 240, 255, 0.85) 52.5%, transparent 56%)',
        'linear-gradient(180deg, #050a24 0%, #030412 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #ffffff' : '3.5px solid #00f0ff';
      boxShadow = '0 0 35px rgba(0, 240, 255, 0.45), 0 0 20px rgba(255, 0, 127, 0.35)';
      break;

    case 'gold-embossed':
      baseBg = '#1c1302';
      gradient = [
        'repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.25) 0px, rgba(245, 158, 11, 0.25) 3px, rgba(217, 119, 6, 0.15) 6px, transparent 6px, transparent 12px)',
        'linear-gradient(135deg, #d97706 0%, #fef08a 35%, #b45309 65%, #78350f 100%)'
      ].join(', ');
      border = '3.5px solid #fef08a';
      boxShadow = '0 0 35px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(254, 240, 138, 0.3)';
      break;

    case 'toxic-ooze':
      baseBg = '#04260a';
      gradient = [
        'radial-gradient(circle at 25% 30%, #39ff14 0, #22c55e 3px, transparent 5px)',
        'radial-gradient(circle at 75% 65%, #39ff14 0, #16a34a 4px, transparent 6px)',
        'radial-gradient(circle at 50% 50%, rgba(57, 255, 20, 0.35) 0%, transparent 65%)',
        'linear-gradient(160deg, #052e16 0%, #14532d 50%, #022c22 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #00f0ff' : '3.5px solid #39ff14';
      boxShadow = '0 0 35px rgba(57, 255, 20, 0.5), inset 0 0 20px rgba(57, 255, 20, 0.25)';
      break;

    case 'cracked-ice':
      baseBg = '#071927';
      gradient = [
        'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 20%, rgba(0,240,255,0.25) 40%, transparent 60%, rgba(168,85,247,0.2) 80%, transparent 100%)',
        'repeating-linear-gradient(60deg, rgba(0, 240, 255, 0.22) 0px, rgba(0, 240, 255, 0.22) 2px, transparent 2px, transparent 24px)',
        'repeating-linear-gradient(-60deg, rgba(255, 255, 255, 0.18) 0px, rgba(255, 255, 255, 0.18) 2px, transparent 2px, transparent 24px)',
        'linear-gradient(180deg, #071927 0%, #0c283d 50%, #030d17 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #ffffff' : '3.5px solid #38bdf8';
      boxShadow = '0 0 30px rgba(56, 189, 248, 0.45), inset 0 0 15px rgba(0, 240, 255, 0.25)';
      break;

    case 'cyber-pcb':
      baseBg = '#042217';
      gradient = [
        'radial-gradient(circle at 25% 30%, #fbbf24 0, #fbbf24 3px, transparent 4px)',
        'radial-gradient(circle at 75% 70%, #fbbf24 0, #fbbf24 3px, transparent 4px)',
        'repeating-linear-gradient(45deg, rgba(251, 191, 36, 0.18) 0px, rgba(251, 191, 36, 0.18) 2px, transparent 2px, transparent 18px)',
        'repeating-linear-gradient(-45deg, rgba(16, 185, 129, 0.22) 0px, rgba(16, 185, 129, 0.22) 2px, transparent 2px, transparent 20px)',
        'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #022c22 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #00f0ff' : '3.5px solid #10b981';
      boxShadow = '0 10px 30px rgba(0, 0, 0, 0.65), inset 0 0 25px rgba(16, 185, 129, 0.25)';
      break;

    case 'synthwave-grid':
      baseBg = '#0c051a';
      gradient = [
        'repeating-linear-gradient(0deg, transparent 0px, transparent 14px, rgba(0, 240, 255, 0.35) 14px, rgba(0, 240, 255, 0.35) 16px)',
        'repeating-linear-gradient(90deg, transparent 0px, transparent 18px, rgba(255, 0, 127, 0.3) 18px, rgba(255, 0, 127, 0.3) 20px)',
        'radial-gradient(circle at 50% 35%, #ff007f 0%, #ff7700 25%, #7928ca 50%, transparent 75%)',
        'linear-gradient(180deg, #0c051a 0%, #190a33 50%, #05020a 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #00f0ff' : '3.5px solid #ff007f';
      boxShadow = '0 0 35px rgba(255, 0, 127, 0.45), inset 0 0 20px rgba(0, 240, 255, 0.2)';
      break;

    case 'vintage-cardstock':
      baseBg = '#f4eedb';
      gradient = 'linear-gradient(145deg, #faf5e8 0%, #ede3c8 50%, #e2d5b4 100%)';
      border = '3.5px solid #b45309';
      boxShadow = '0 10px 25px rgba(0,0,0,0.35), inset 0 0 25px rgba(180, 140, 80, 0.2)';
      break;

    case 'liquid-chrome':
      baseBg = '#1e293b';
      gradient = [
        'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.7) 0%, transparent 50%)',
        'linear-gradient(135deg, rgba(255, 0, 128, 0.2) 0%, rgba(0, 240, 255, 0.2) 50%, rgba(168, 85, 247, 0.2) 100%)',
        'linear-gradient(160deg, #475569 0%, #94a3b8 30%, #334155 60%, #cbd5e1 100%)'
      ].join(', ');
      border = '3.5px solid #f8fafc';
      boxShadow = '0 0 35px rgba(226, 232, 240, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.35)';
      break;

    case 'cosmic-nebula':
      baseBg = '#070414';
      gradient = [
        'radial-gradient(circle at 20% 25%, rgba(236, 72, 153, 0.45) 0%, transparent 45%)',
        'radial-gradient(circle at 80% 75%, rgba(139, 92, 246, 0.5) 0%, transparent 50%)',
        'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.35) 0%, transparent 60%)',
        'linear-gradient(145deg, #070414 0%, #150a2e 50%, #05020a 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #00f0ff' : '3.5px solid #a855f7';
      boxShadow = '0 0 35px rgba(168, 85, 247, 0.45), inset 0 0 20px rgba(236, 72, 153, 0.25)';
      break;

    case 'hypercolor-thermal':
      baseBg = '#2d0036';
      gradient = [
        'radial-gradient(ellipse at 80% 20%, rgba(255, 230, 0, 0.6) 0%, transparent 45%)',
        'radial-gradient(ellipse at 25% 45%, rgba(255, 0, 128, 0.7) 0%, transparent 55%)',
        'linear-gradient(140deg, #1c0029 0%, #4a044e 45%, #831843 85%)'
      ].join(', ');
      border = '3.5px solid #f43f5e';
      boxShadow = '0 0 35px rgba(244, 63, 94, 0.5), inset 0 0 20px rgba(255, 230, 0, 0.3)';
      break;

    case 'vhs-static':
      baseBg = '#090910';
      gradient = [
        'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 2px, transparent 2px, transparent 4px)',
        'linear-gradient(90deg, rgba(255,0,80,0.18), rgba(0,240,255,0.18))',
        'linear-gradient(160deg, #090910 0%, #151522 50%, #050508 100%)'
      ].join(', ');
      border = '3.5px solid #00f0ff';
      boxShadow = '0 0 30px rgba(0,240,255,0.4), inset 0 0 15px rgba(255,0,128,0.25)';
      break;

    case 'jazz-cup':
      baseBg = '#ffffff';
      gradient = [
        'repeating-linear-gradient(135deg, rgba(0, 168, 150, 0.25) 0px, rgba(0, 168, 150, 0.25) 8px, transparent 8px, transparent 24px)',
        'repeating-linear-gradient(45deg, rgba(157, 78, 221, 0.25) 0px, rgba(157, 78, 221, 0.25) 8px, transparent 8px, transparent 28px)',
        'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)'
      ].join(', ');
      border = '3.5px solid #00a896';
      boxShadow = '0 10px 25px rgba(0, 168, 150, 0.35)';
      break;

    case 'holo-diffraction':
    default:
      baseBg = '#111827';
      gradient = [
        'repeating-linear-gradient(125deg, rgba(255, 0, 127, 0.35) 0px, rgba(0, 240, 255, 0.35) 15px, rgba(255, 230, 0, 0.35) 30px, rgba(57, 255, 20, 0.35) 45px, rgba(189, 0, 255, 0.35) 60px)',
        'linear-gradient(135deg, #1f2937 0%, #111827 50%, #030712 100%)'
      ].join(', ');
      border = isPrism ? '3.5px solid #ffffff' : '3.5px solid #38bdf8';
      boxShadow = '0 0 35px rgba(56, 189, 248, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)';
      break;
  }

  return {
    backgroundColor: baseBg,
    backgroundImage: gradient,
    backgroundSize: bgSize,
    backgroundPosition: bgPosition,
    border,
    boxShadow
  };
}

export function generateThemeStyles(
  theme: CardThemeType = 'memphis-rad',
  foilRarity: string = 'standard',
  threatColor: string = '#FF007F'
): React.CSSProperties {
  const isPrism = foilRarity === 'prism';
  const isGold = foilRarity === 'gold';
  const isSilver = foilRarity === 'silver';
  return getThemeCardStyle(theme, threatColor, isPrism, isGold, isSilver);
}

export const captureCanvasBlob = async (
  targetEl: HTMLElement, 
  bgColor: string = '#090a10',
  fallbackImageUrl?: string
): Promise<Blob> => {
  const clone = targetEl.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.webkitTransform = 'none';
  clone.style.transformStyle = 'flat';
  clone.style.backfaceVisibility = 'visible';
  clone.style.position = 'relative';
  clone.style.top = '0px';
  clone.style.left = '0px';

  const rect = targetEl.getBoundingClientRect();
  const width = rect.width > 120 ? Math.round(rect.width) : 420;
  const height = rect.height > 120 ? Math.round(rect.height) : Math.round(width * (7 / 5));
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const liveVideos = Array.from(targetEl.querySelectorAll('video'));
  const clonedVideos = Array.from(clone.querySelectorAll('video'));
  liveVideos.forEach((liveVid, idx) => {
    const clonedVid = clonedVideos[idx];
    if (!clonedVid) return;
    const replacementSrc = liveVid.poster || fallbackImageUrl || '';
    if (replacementSrc) {
      const img = document.createElement('img');
      img.src = replacementSrc;
      img.crossOrigin = 'anonymous';
      img.className = clonedVid.className;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      clonedVid.parentNode?.replaceChild(img, clonedVid);
    }
  });

  const stagingContainer = document.createElement('div');
  stagingContainer.style.position = 'fixed';
  stagingContainer.style.left = '0px';
  stagingContainer.style.top = '0px';
  stagingContainer.style.width = `${width}px`;
  stagingContainer.style.height = `${height}px`;
  stagingContainer.style.overflow = 'hidden';
  stagingContainer.style.pointerEvents = 'none';
  stagingContainer.style.zIndex = '-99999';
  stagingContainer.style.opacity = '0.01';
  stagingContainer.appendChild(clone);
  document.body.appendChild(stagingContainer);

  try {
    const canvas = await html2canvas(clone, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      scale: 2,
      width,
      height
    });
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas rasterization failed'));
      }, 'image/png');
    });
  } finally {
    if (stagingContainer.parentNode) stagingContainer.parentNode.removeChild(stagingContainer);
  }
};

export const triggerBrowserDownload = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }, 2000);
};

export interface TradingCardVisualProps {
  encounter: CombatEncounter;
  imageUrl?: string;
  videoUrl?: string;
  driveFolder?: string;
  autoDriveUpload?: boolean;
  driveAccessToken?: string | null;
  driveUser?: User | null;
  onDriveConnected?: (user: User, token: string) => void;
  onNotify?: (msg: string) => void;
  hideControls?: boolean;
  cardNumber?: number;
  isFoil?: boolean;
  foilRarity?: 'standard' | 'silver' | 'gold' | 'prism';
  activeMediaView?: 'image' | 'video';
  onMediaViewChange?: (view: 'image' | 'video') => void;
  displaySide?: 'front' | 'back' | 'both';
  locationName?: string;
  cardTheme?: CardThemeType;
  exportOnly?: 'front' | 'back';
  exportTargetId?: string;
  onThemeChange?: (theme: CardThemeType) => void;
}

export const ChecklistCardFront: React.FC<{
  encounter: CombatEncounter;
  cardNumber: number;
  foilRarity: 'standard' | 'silver' | 'gold' | 'prism';
  threatColor: string;
  theme: CardThemeType;
  hideControls?: boolean;
  onFlip?: () => void;
}> = ({ encounter, hideControls, onFlip }) => {
  const rawItems: ChecklistItem[] = encounter.checklist_items || [];
  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative z-10 font-sans text-zinc-100">
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-zinc-700/60 shrink-0">
        <span className="px-2 py-0.5 bg-yellow-400 text-black font-black text-[9px] uppercase">
          ★ 199X MASTER CHECKLIST
        </span>
        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black bg-yellow-400/20 text-yellow-300 border border-yellow-500/50">
          CARD #00
        </span>
      </div>

      <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 border border-black text-zinc-950 font-black text-xs uppercase tracking-wide my-1 flex items-center justify-between">
        <span>COLLECTED SPECIMENS REGISTER</span>
        <span className="text-[9px] font-mono font-bold bg-black text-yellow-400 px-1 py-0.2 rounded">
          {rawItems.length}/53
        </span>
      </div>

      <div className="flex-1 min-h-0 bg-black/75 rounded-lg p-2 border border-zinc-800 space-y-1 overflow-y-auto font-mono text-[9px]">
        {rawItems.length === 0 ? (
          <div className="text-zinc-500 text-center py-6 italic text-[9.5px]">
            No specimens registered yet.<br />Capture entities to populate register!
          </div>
        ) : (
          rawItems.map((item) => (
            <div key={item.number} className="flex items-center justify-between text-zinc-200 hover:bg-zinc-800/40 px-1 py-0.5 rounded">
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-yellow-400 font-bold">☑ #{String(item.number).padStart(2, '0')}</span>
                <span className="truncate">{item.name}</span>
              </span>
              <span className="text-[8px] text-emerald-400 uppercase font-bold shrink-0 ml-1">SECURED</span>
            </div>
          ))
        )}
      </div>

      <div className="pt-1.5 border-t border-zinc-800 text-[8.5px] font-mono text-zinc-400 flex items-center justify-between shrink-0">
        <span>SERIES 2 • CARD #00</span>
        <span className="text-yellow-400 font-bold">{rawItems.length} OF 53 SECURED</span>
      </div>
    </div>
  );
};

export const ChecklistCardBack: React.FC<{
  encounter: CombatEncounter;
  cardNumber: number;
  foilRarity: 'standard' | 'silver' | 'gold' | 'prism';
  threatColor: string;
  theme: CardThemeType;
  videoUrl?: string;
  hideControls?: boolean;
  onFlip?: () => void;
}> = ({ encounter, videoUrl, hideControls, onFlip }) => {
  const count = encounter.checklist_items?.length || 0;
  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative z-10 font-sans text-zinc-100">
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-zinc-700/60 shrink-0">
        <span className="px-2 py-0.5 bg-purple-600 text-white font-black text-[9px] uppercase">
          {videoUrl ? 'SERIES 2 MASTER REEL' : 'SERIES 2 COMPLETION LOG'}
        </span>
        <span className="text-[9px] font-mono font-bold text-cyan-300">{count} SPECIMENS</span>
      </div>

      {videoUrl ? (
        <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border-2 border-yellow-500/70 bg-black shrink-0 my-1 shadow-inner">
          <video 
            src={videoUrl} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.35)_3px)] opacity-60 z-10" />
          <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/85 text-[7.5px] font-mono font-bold text-yellow-300 border border-yellow-500/50 flex items-center gap-1 z-20">
            <Film className="w-2.5 h-2.5 text-yellow-400" />
            <span>4S VHS MASTER LOOP</span>
          </div>
          <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-red-950/80 text-[6.5px] font-mono font-bold text-red-400 border border-red-800/80 z-20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>REC 24FPS</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 bg-black/75 rounded-lg p-3 border border-zinc-800 space-y-2 my-1 flex flex-col justify-center text-center font-mono">
          <Sparkles className="w-8 h-8 text-yellow-400 mx-auto animate-pulse" />
          <div className="text-xs font-black text-yellow-300 uppercase">
            199X ARCHIVAL COMPLETION CERTIFICATE
          </div>
          <p className="text-[10px] text-zinc-300 leading-relaxed max-w-xs mx-auto">
            Certified archival register for Series 2. Tracks Specimens #01 through #53 inside official Ultra PRO polypropylene 9-pocket sheets.
          </p>
          <div className="text-[11px] font-mono font-bold text-yellow-400">
            {count} / 53 ENTITIES ARCHIVED
          </div>
        </div>
      )}

      <div className="pt-1.5 border-t border-zinc-800 text-[8.5px] font-mono text-zinc-400 flex items-center justify-between shrink-0">
        <span>CARD #00 • ARCHIVE CAPSTONE</span>
        <span className="text-emerald-400 font-bold">✓ {count} SPECIMENS SYNCED</span>
      </div>
    </div>
  );
};

export const CardFront: React.FC<{
  encounter: CombatEncounter;
  imageUrl?: string;
  videoUrl?: string;
  cardNumber: number;
  foilRarity: 'standard' | 'silver' | 'gold' | 'prism';
  threatColor: string;
  locationName?: string;
  hideControls?: boolean;
  theme: CardThemeType;
  onFlip?: () => void;
}> = ({ encounter, imageUrl, videoUrl, cardNumber, foilRarity, threatColor, hideControls, theme, onFlip }) => {
  if (encounter.card_type === 'checklist' || cardNumber === 0) {
    return (
      <ChecklistCardFront 
        encounter={encounter} 
        cardNumber={0} 
        foilRarity={foilRarity} 
        threatColor={threatColor} 
        theme={theme} 
        hideControls={hideControls} 
        onFlip={onFlip} 
      />
    );
  }

  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextMuted = !isMuted;
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    setIsMuted(nextMuted);
  };

  const formattedNum = String(cardNumber).padStart(2, '0');
  const isBadGuy = encounter.card_type !== 'good_guy';
  const isME = Boolean(encounter.theme_set_id?.startsWith('me-'));

  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative z-10 font-sans text-zinc-100">
      <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-zinc-700/60 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`px-2 py-0.5 text-white font-black text-[9px] uppercase border border-black ${isBadGuy ? 'bg-red-600' : 'bg-cyan-600'}`}>
            {isME ? (isBadGuy ? 'ME! ANOMALY' : 'ME! OPERATIVE') : (isBadGuy ? '199X VILLAIN' : '199X HERO')}
          </span>
          <span className="text-yellow-400 text-[9px] font-mono font-black uppercase">
            {isME ? 'MUTABLE ECHO' : 'SERIES 2'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 font-mono">
          {!hideControls && onFlip && (
            <button
              type="button"
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                onFlip(); 
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="px-1.5 py-0.5 rounded bg-black/80 hover:bg-black text-pink-300 border border-pink-500/60 text-[8.5px] font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>FLIP</span>
            </button>
          )}
          <span className="px-2 py-0.5 rounded text-[9px] bg-zinc-900 text-zinc-200 border border-zinc-700">
            #{formattedNum}
          </span>
        </div>
      </div>

      {/* Front Center Media: 4-Second Kinetic Action Reel (with Image Fallback) */}
      <div 
        className="relative flex-1 min-h-[175px] w-full rounded-xl overflow-hidden border-2 border-black mb-1.5 shadow-inner bg-black flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {videoUrl ? (
          <>
            <video 
              ref={videoRef}
              src={videoUrl} 
              autoPlay 
              loop 
              muted={isMuted} 
              playsInline 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.35)_3px)] opacity-60 z-10" />
            
            <button
              type="button"
              onClick={handleToggleMute}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/90 hover:bg-black text-zinc-100 text-[8.5px] font-mono font-bold border border-zinc-600 z-30 cursor-pointer flex items-center gap-1 shadow-md active:scale-95 transition-all"
              title={isMuted ? 'Click to Unmute' : 'Click to Mute'}
            >
              {isMuted ? <VolumeX className="w-2.5 h-2.5 text-zinc-400" /> : <Volume2 className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />}
              <span>{isMuted ? 'UNMUTE' : 'AUDIO ON'}</span>
            </button>

            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/85 text-yellow-300 border border-zinc-700 z-10 flex items-center gap-1">
              <Film className="w-2.5 h-2.5 text-yellow-400" />
              <span>4S ACTION REEL</span>
            </div>
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/80 z-10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>REC 24FPS</span>
            </div>
          </>
        ) : imageUrl ? (
          <div className="relative w-full h-full">
            <img src={imageUrl} alt={encounter.entity_name} className="w-full h-full object-cover select-none" />
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.25)_3px)] opacity-40 z-10" />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/85 text-cyan-300 border border-zinc-700 z-10 flex items-center gap-1">
              <ImageIcon className="w-2.5 h-2.5 text-cyan-400" />
              <span>199X ART • REEL READY</span>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <Film className="w-8 h-8 text-yellow-500 animate-pulse mx-auto" />
            <span className="text-xs font-mono font-bold uppercase text-zinc-400 block">[ NO ACTION REEL LOADED ]</span>
          </div>
        )}
      </div>

      <div className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 border-2 border-black text-zinc-950 font-black tracking-wide uppercase shadow-[2px_2px_0px_#000] -skew-x-6 flex items-center justify-between gap-2 mb-1 shrink-0">
        <span className="skew-x-6 text-xs sm:text-sm font-black truncate block leading-tight">
          {encounter.entity_name}
        </span>
        <span className="skew-x-6 px-1.5 py-0.2 bg-black text-yellow-300 text-[8.5px] font-mono font-black shrink-0">
          {encounter.critical_smash ? 'OMEGA THREAT' : 'THREAT'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-zinc-700/60 text-[8.5px] font-mono shrink-0 text-zinc-400">
        <span>{isME ? `ME! ARCHIVE • NODE #${formattedNum}` : `SERIES 2 • CARD #${formattedNum}`}</span>
        <span className="font-bold text-yellow-400">{isME ? '★ 432Hz SEVERANCE EDITION' : '★ 199X HOBBY EDITION'}</span>
      </div>
    </div>
  );
};

export const CardBack: React.FC<{
  encounter: CombatEncounter;
  videoUrl?: string;
  imageUrl?: string;
  cardNumber: number;
  foilRarity: 'standard' | 'silver' | 'gold' | 'prism';
  threatColor: string;
  locationName?: string;
  hideControls?: boolean;
  theme: CardThemeType;
  onFlip?: () => void;
}> = ({ encounter, videoUrl, imageUrl, cardNumber, threatColor, locationName, hideControls, theme, onFlip }) => {
  if (encounter.card_type === 'checklist' || cardNumber === 0) {
    return (
      <ChecklistCardBack 
        encounter={encounter} 
        cardNumber={0} 
        foilRarity="gold" 
        threatColor={threatColor} 
        theme={theme} 
        videoUrl={videoUrl}
        hideControls={hideControls} 
        onFlip={onFlip} 
      />
    );
  }

  const formattedNum = String(cardNumber).padStart(2, '0');
  const isBadGuy = encounter.card_type !== 'good_guy';
  const isME = Boolean(encounter.theme_set_id?.startsWith('me-'));

  const stats: ImpelRatings = (encounter as any).impel_ratings || { strength: 5, speed: 4, energy: 6, psychic: 7 };

  const renderStatBlocks = (val: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
        <span
          key={num}
          className={`w-2.5 h-2.5 rounded-xs border text-[7px] flex items-center justify-center ${
            num <= val ? 'bg-yellow-300 border-black font-black text-black' : 'bg-black/20 border-black/40 text-transparent'
          }`}
        >
          {num <= val ? '■' : ''}
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative z-10 font-sans text-zinc-100">
      <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-zinc-700/60 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`px-2 py-0.5 text-white font-black text-[9px] uppercase border border-black ${isBadGuy ? 'bg-red-600' : 'bg-cyan-600'}`}>
            {isME ? (isBadGuy ? 'ME! TARGET' : 'ME! OPERATIVE') : (isBadGuy ? '199X THREAT' : '199X DOSSIER')}
          </span>
          <span className="text-[10px] font-black uppercase font-mono text-yellow-300 truncate">
            {encounter.entity_name}
          </span>
        </div>
        {!hideControls && onFlip && (
          <button
            type="button"
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation(); 
              onFlip(); 
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-1.5 py-0.5 rounded bg-black/80 hover:bg-black text-yellow-300 border border-yellow-500/60 text-[8.5px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>FLIP</span>
          </button>
        )}
      </div>

      {/* Back Media: Classified Archival Still Image */}
      <div 
        className="relative w-full flex-1 min-h-[160px] rounded-xl overflow-hidden border-2 border-black bg-black mb-1.5 shadow-inner flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <div className="relative w-full h-full">
            <img src={imageUrl} alt={encounter.entity_name} className="w-full h-full object-cover filter contrast-105" />
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.25)_3px)] opacity-40 z-10" />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/85 text-cyan-300 border border-zinc-700 z-10 flex items-center gap-1">
              <ImageIcon className="w-2.5 h-2.5 text-cyan-400" />
              <span>CLASSIFIED ARCHIVAL STILL</span>
            </div>
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-zinc-900/90 text-zinc-300 border border-zinc-700 z-10">
              HIGH-RES SPECIMEN
            </div>
          </div>
        ) : videoUrl ? (
          <div className="relative w-full h-full">
            <video 
              src={videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover opacity-80" 
            />
            <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.35)_3px)] opacity-60 z-10" />
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-black/85 text-yellow-300 border border-zinc-700 z-10">
              VIDEO STILL POSTER
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-zinc-950 text-zinc-400">
            <ImageIcon className="w-6 h-6 text-zinc-600 mb-1" />
            <span className="text-[9px] font-bold uppercase font-mono text-zinc-400">[ ARCHIVAL STILL PENDING ]</span>
          </div>
        )}
      </div>

      {/* Expanded Complete Field Dossier (Gear & Buff box removed to provide complete narrative room) */}
      <div className="p-2.5 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 border-2 border-black text-zinc-950 shadow-[2px_2px_0px_#000] rounded-lg mb-1.5 flex-1 min-h-[96px] max-h-[165px] flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between text-[8.5px] font-mono font-black uppercase tracking-wider pb-1 border-b border-black/25 mb-1 shrink-0">
          <span className="px-1.5 py-0.5 bg-black text-cyan-300 rounded-xs flex items-center gap-1 shadow-xs">
            <FileText className="w-2.5 h-2.5" />
            FIELD DOSSIER // RECON REPORT
          </span>
          <span className="text-[8px] font-black bg-white/90 border border-black/40 px-1.5 py-0.2 rounded-xs shadow-xs">
            {locationName || 'SUBURBAN SECTOR'}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1 select-text">
          <p className="text-[10px] sm:text-[10.5px] leading-relaxed font-serif font-bold text-zinc-950">
            {encounter.cosmic_distortion || "Dimensional rupture confirmed in suburban quadrant. Local retail physics destabilized under anomalous radiation."}
          </p>
        </div>
        <div className="pt-1 border-t border-black/20 flex items-center justify-between text-[7px] font-mono font-bold text-zinc-800 shrink-0 mt-1">
          <span>CLASSIFIED RECON RECORD</span>
          <span>SUBURBAN ANOMALY SURVEILLANCE</span>
        </div>
      </div>

      <div className="p-1.5 bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-400 border-2 border-black text-zinc-950 shadow-[2px_2px_0px_#000] rounded-lg mb-1.5 shrink-0">
        <div className="flex items-center justify-between text-[7.5px] font-mono font-black uppercase mb-1 pb-0.5 border-b border-black/20">
          <span className="px-1.5 py-0.2 bg-black text-pink-300 rounded-xs flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-yellow-300" />
            POWER RATINGS (1-7)
          </span>
          <span className="px-1.5 py-0.2 bg-black text-yellow-300 rounded-xs font-mono">
            {encounter.status_affliction ? `STATUS: ${encounter.status_affliction.slice(0, 16)}` : 'SECURED'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-mono">
          <div className="flex items-center justify-between">
            <span className="font-black text-zinc-950">{isME ? 'OBL:' : 'STR:'}</span>
            {renderStatBlocks(stats.strength)}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-black text-zinc-950">{isME ? 'SEV:' : 'SPD:'}</span>
            {renderStatBlocks(stats.speed)}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-black text-zinc-950">{isME ? 'ABS:' : 'ENG:'}</span>
            {renderStatBlocks(stats.energy)}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-black text-zinc-950">{isME ? 'RES:' : 'PSY:'}</span>
            {renderStatBlocks(stats.psychic)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-zinc-700/60 text-[8.5px] font-mono shrink-0 text-zinc-400">
        <span className="text-[7.5px]">{isME ? '© ME! // MUTABLE ECHO ARCHIVE' : '© 199X SUBURBAN ROGUELIKE'}</span>
        <div className="flex items-center gap-1 bg-white px-1.5 py-0.2 rounded text-zinc-950 font-black text-[7.5px] border border-zinc-400">
          <Barcode className="w-3 h-2 text-zinc-950" />
          <span>{isME ? `#ME!-${formattedNum}` : `#199X-${formattedNum}`}</span>
        </div>
      </div>
    </div>
  );
};

export const TradingCardVisual: React.FC<TradingCardVisualProps> = ({ 
  encounter, 
  imageUrl,
  videoUrl,
  hideControls = false,
  cardNumber,
  isFoil: isFoilProp,
  foilRarity: foilRarityProp,
  displaySide = 'both',
  locationName,
  cardTheme: cardThemeProp,
  exportOnly,
  exportTargetId,
  onThemeChange
}) => {
  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);

  const [selectedTheme, setSelectedTheme] = useState<CardThemeType>(() => {
    if (cardThemeProp) return cardThemeProp;
    return encounter.card_theme || 'memphis-rad';
  });

  // Keep theme synced whenever a new encounter is rolled or cardThemeProp updates
  useEffect(() => {
    if (cardThemeProp) {
      setSelectedTheme(cardThemeProp);
    } else if (encounter.card_theme) {
      setSelectedTheme(encounter.card_theme);
    }
  }, [encounter, cardThemeProp, encounter.card_theme]);

  // Listen to global finish updates dispatched from TrapperKeeperArchive
  useEffect(() => {
    const handleGlobalTheme = (e: Event) => {
      const customEvent = e as CustomEvent<CardThemeType>;
      if (customEvent.detail && customEvent.detail !== selectedTheme) {
        setSelectedTheme(customEvent.detail);
      }
    };
    window.addEventListener('199x-theme-changed', handleGlobalTheme);
    return () => window.removeEventListener('199x-theme-changed', handleGlobalTheme);
  }, [selectedTheme]);

  const handleThemeChange = (newTheme: CardThemeType) => {
    setSelectedTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(new CustomEvent('199x-theme-changed', { detail: newTheme }));
    }
    onThemeChange?.(newTheme);
  };

  const currentThemeIndex = Math.max(0, CARD_THEMES_CATALOG.findIndex(t => t.id === selectedTheme));

  const handlePrevTheme = () => {
    const nextIdx = (currentThemeIndex - 1 + CARD_THEMES_CATALOG.length) % CARD_THEMES_CATALOG.length;
    handleThemeChange(CARD_THEMES_CATALOG[nextIdx].id);
  };

  const handleNextTheme = () => {
    const nextIdx = (currentThemeIndex + 1) % CARD_THEMES_CATALOG.length;
    handleThemeChange(CARD_THEMES_CATALOG[nextIdx].id);
  };

  const handleRandomTheme = () => {
    const available = CARD_THEMES_CATALOG.filter(t => t.id !== selectedTheme);
    const pick = available[Math.floor(Math.random() * available.length)];
    if (pick) handleThemeChange(pick.id);
  };

  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>(displaySide);
  const [isFlipped, setIsFlipped] = useState<boolean>(displaySide === 'back');

  const threatColor = encounter.threat_level_color || '#FF007F';
  const resolvedFoilRarity = foilRarityProp || encounter.card_foil_rarity || (isFoilProp ? 'silver' : 'standard');
  const isPrism = resolvedFoilRarity === 'prism';
  const isGold = resolvedFoilRarity === 'gold';
  const isSilver = resolvedFoilRarity === 'silver';
  const cardNum = cardNumber ?? encounter.card_number ?? 1;

  const handleFlipToggle = () => {
    if (activeSide === 'both') {
      setActiveSide('front');
      setIsFlipped(true);
    } else {
      setIsFlipped(prev => {
        const next = !prev;
        setActiveSide(next ? 'back' : 'front');
        return next;
      });
    }
  };

  const cardOuterStyle = getThemeCardStyle(selectedTheme, threatColor, isPrism, isGold, isSilver);

  return (
    <div className="w-full space-y-4 font-mono">
      {!hideControls && (
        <div data-html2canvas-ignore="true" className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveSide('both')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSide === 'both' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>[ DUAL VIEW ]</span>
              </button>
              <button
                type="button"
                onClick={handleFlipToggle}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 text-white"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>[ 3D FLIP ]</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-700">
                <Palette className="w-3.5 h-3.5 text-yellow-400" />
                <button
                  type="button"
                  onClick={handlePrevTheme}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                  title="Previous Finish"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <select
                  value={selectedTheme}
                  onChange={(e) => handleThemeChange(e.target.value as CardThemeType)}
                  className="bg-black text-cyan-300 text-xs font-mono font-bold px-2 py-0.5 rounded border border-zinc-700 outline-none cursor-pointer"
                >
                  {CARD_THEMES_CATALOG.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.icon} {theme.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleNextTheme}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                  title="Next Finish"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRandomTheme}
                  className="px-2.5 py-1 rounded-lg bg-yellow-400/20 hover:bg-yellow-400 hover:text-black text-yellow-300 text-xs font-bold border border-yellow-500/50 flex items-center gap-1 transition-all cursor-pointer"
                  title="Roll random background finish"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>ROLL FINISH</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {exportOnly ? (
        <div className="w-full flex justify-center py-2">
          <div
            ref={exportOnly === 'back' ? backCardRef : frontCardRef}
            id={exportTargetId || `trading-card-export-target-${(encounter as any)?.id || cardNum}`}
            className="w-full max-w-[420px] aspect-[5/7] rounded-2xl p-3 sm:p-3.5 overflow-hidden shadow-2xl flex flex-col justify-between relative"
            style={cardOuterStyle}
          >
            {exportOnly === 'back' ? (
              <CardBack encounter={encounter} videoUrl={videoUrl} imageUrl={imageUrl} cardNumber={cardNum} foilRarity={resolvedFoilRarity} threatColor={threatColor} locationName={locationName} hideControls={true} theme={selectedTheme} />
            ) : (
              <CardFront encounter={encounter} videoUrl={videoUrl} imageUrl={imageUrl} cardNumber={cardNum} foilRarity={resolvedFoilRarity} threatColor={threatColor} locationName={locationName} hideControls={true} theme={selectedTheme} />
            )}
          </div>
        </div>
      ) : activeSide === 'both' ? (
        <div className="grid gap-5 justify-center grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="w-full max-w-[360px] sm:max-w-[375px] mx-auto flex flex-col space-y-1.5 items-center">
            <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Film className="w-3.5 h-3.5" /> CARD FRONT (ACTION REEL)
            </span>
            <div ref={frontCardRef} className="relative w-full aspect-[5/7] rounded-2xl p-3 sm:p-3.5 overflow-hidden shadow-2xl flex flex-col justify-between" style={cardOuterStyle}>
              <CardFront encounter={encounter} videoUrl={videoUrl} imageUrl={imageUrl} cardNumber={cardNum} foilRarity={resolvedFoilRarity} threatColor={threatColor} locationName={locationName} hideControls={hideControls} theme={selectedTheme} onFlip={handleFlipToggle} />
            </div>
          </div>

          <div className="w-full max-w-[360px] sm:max-w-[375px] mx-auto flex flex-col space-y-1.5 items-center">
            <span className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> CARD BACK (FIELD DOSSIER & STILL)
            </span>
            <div ref={backCardRef} className="relative w-full aspect-[5/7] rounded-2xl p-3 sm:p-3.5 overflow-hidden shadow-2xl flex flex-col justify-between" style={cardOuterStyle}>
              <CardBack encounter={encounter} videoUrl={videoUrl} imageUrl={imageUrl} cardNumber={cardNum} foilRarity={resolvedFoilRarity} threatColor={threatColor} locationName={locationName} hideControls={hideControls} theme={selectedTheme} onFlip={handleFlipToggle} />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[390px] sm:max-w-[420px] mx-auto flex flex-col space-y-3 items-center">
          <div 
            className="w-full aspect-[5/7] cursor-pointer" 
            onClick={handleFlipToggle} 
            style={{ perspective: '1200px' }}
          >
            <div 
              className="relative w-full h-full transition-transform duration-700 ease-out select-none" 
              style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              <div 
                ref={frontCardRef} 
                className="absolute inset-0 w-full h-full rounded-2xl p-3 sm:p-3.5 overflow-hidden shadow-2xl flex flex-col justify-between" 
                style={{ 
                  ...cardOuterStyle, 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  pointerEvents: isFlipped ? 'none' : 'auto',
                  zIndex: isFlipped ? 0 : 10
                }}
              >
                <CardFront encounter={encounter} videoUrl={videoUrl} imageUrl={imageUrl} cardNumber={cardNum} foilRarity={resolvedFoilRarity} threatColor={threatColor} locationName={locationName} hideControls={hideControls} theme={selectedTheme} onFlip={handleFlipToggle} />
              </div>

              <div 
                ref={backCardRef} 
                className="absolute inset-0 w-full h-full rounded-2xl p-3 sm:p-3.5 overflow-hidden shadow-2xl flex flex-col justify-between" 
                style={{ 
                  ...cardOuterStyle, 
                  backfaceVisibility: 'hidden', 
                  WebkitBackfaceVisibility: 'hidden', 
                  transform: 'rotateY(180deg)',
                  pointerEvents: isFlipped ? 'auto' : 'none',
                  zIndex: isFlipped ? 10 : 0
                }}
              >
                <CardBack encounter={encounter} videoUrl={videoUrl} imageUrl={imageUrl} cardNumber={cardNum} foilRarity={resolvedFoilRarity} threatColor={threatColor} locationName={locationName} hideControls={hideControls} theme={selectedTheme} onFlip={handleFlipToggle} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};