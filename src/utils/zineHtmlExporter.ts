import { ZineIssueData } from '../engine/zineEngine';
import { getZinePalette } from '../data/zinePalettes';
import { StudioUiTheme } from '../data/uiThemes';

async function urlToDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const cleanUrl = url.split('#')[0];
    const res = await fetch(cleanUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Failed to encode media'));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function urlToCompactImageDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const cleanUrl = url.split('#')[0];
    const res = await fetch(cleanUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.type === 'image/gif') {
      return await urlToDataUri(url);
    }
    const objUrl = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = objUrl;
      });
      const maxW = 1280;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const cvs = document.createElement('canvas');
      cvs.width = w;
      cvs.height = h;
      const ctx = cvs.getContext('2d');
      if (!ctx) return await urlToDataUri(url);
      ctx.drawImage(img, 0, 0, w, h);
      return cvs.toDataURL('image/jpeg', 0.86);
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } catch {
    return await urlToDataUri(url);
  }
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function exportStandaloneZineHtml(
  issue: ZineIssueData,
  onProgress?: (status: string) => void,
  uiTheme?: StudioUiTheme
): Promise<void> {
  const pal = getZinePalette(issue.zinePaletteId);
  const isDark = Boolean(uiTheme?.isDark);
  const expTheme = {
    paperBg: isDark ? uiTheme!.middleBg : pal.paperBg,
    bgImage:
      isDark && uiTheme!.middleBgImage
        ? uiTheme!.middleBgImage
        : 'radial-gradient(rgba(18, 18, 18, 0.14) 1.4px, transparent 1.4px)',
    bgSize:
      isDark && uiTheme!.middleBgSize ? uiTheme!.middleBgSize : '16px 16px',
    surfaceBg: isDark ? uiTheme!.surfaceBg : '#FFFFFF',
    surfaceElevated: isDark ? uiTheme!.surfaceElevated : '#FFFFFF',
    inputBg: isDark ? uiTheme!.inputBg : '#FFFFFF',
    mastheadBg: isDark ? uiTheme!.mastheadBg : pal.heroYellow,
    tile1: isDark ? uiTheme!.tile1 : pal.act1Tint,
    tile2: isDark ? uiTheme!.tile2 : pal.act2Tint,
    tile3: isDark ? uiTheme!.tile3 : pal.act3Tint,
    tile4: isDark ? uiTheme!.tile4 : '#FFFDF4',
    heroYellow: isDark ? uiTheme!.accent1 : pal.heroYellow,
    heroYellowInk: isDark ? uiTheme!.accent1Ink : '#121212',
    popPink: isDark ? uiTheme!.accent2 : pal.popPink,
    popPinkInk: isDark ? uiTheme!.accent2Ink : '#FFFFFF',
    popCyan: isDark ? uiTheme!.accent3 : pal.popCyan,
    popCyanInk: isDark ? uiTheme!.accent3Ink : '#121212',
    popLime: isDark ? uiTheme!.accent4 : pal.popLime,
    popLimeInk: isDark ? uiTheme!.accent4Ink : '#121212',
    ink: isDark ? uiTheme!.ink : pal.ink,
    mutedInk: isDark ? uiTheme!.mutedInk : '#525252',
    borderColor: isDark ? uiTheme!.borderColor : '#121212',
    shadowColor: isDark ? uiTheme!.subShadowColor : '#121212',
    tickerBg: isDark ? uiTheme!.marqueeBg : pal.ink,
    titleShadow: isDark
      ? `3px 3px 0px ${uiTheme!.borderColor}`
      : '3px 3px 0px #FFFFFF',
  };

  onProgress?.('Packing 4x Story Shots (Optimized)...');
  const encodedShots: (string | null)[] = [null, null, null, null];
  for (let i = 0; i < 4; i++) {
    encodedShots[i] = await urlToCompactImageDataUri(issue.galleryUrls[i]);
  }
  const presentGallery = encodedShots.filter((s): s is string => Boolean(s));

  onProgress?.('Packing Story GIFs...');
  const encodedGif1 = await urlToDataUri(issue.gifUrl);
  const encodedGif2 = issue.gifUrl2 ? await urlToDataUri(issue.gifUrl2) : null;

  onProgress?.('Packing Lead & Finale Videos...');
  const encodedVideo = await urlToDataUri(issue.videoUrl);
  const encodedOutroVideo = issue.outroVideoUrl
    ? await urlToDataUri(issue.outroVideoUrl)
    : null;

  onProgress?.('Packing Synth Song...');
  const encodedAudio = await urlToDataUri(issue.audioUrl);

  const cardImg =
    (await urlToCompactImageDataUri(issue.cardImageUrl)) ||
    encodedShots[2] ||
    encodedShots[1] ||
    encodedShots[0] ||
    '';

  onProgress?.('Printing Standalone 199X Zine...');

  const renderGifBlockHtml = (
    gifData: string | null,
    badge: string,
    badgeBg: string,
    badgeInk: string,
    caption: string,
    rot: string
  ) => {
    if (!gifData) return '';
    const mediaInner = gifData.startsWith('data:video/')
      ? `<video src="${gifData}" autoplay loop muted playsinline class="w-full h-auto max-h-[640px] object-contain block"></video>`
      : `<img src="${gifData}" alt="${escapeHtml(badge)}" class="w-full h-auto max-h-[640px] object-contain block" />`;
    return `
      <div style="transform: rotate(${rot});" class="relative pop-card th-surface p-4 flex flex-col justify-between hover:!rotate-0 transition-transform">
        <div class="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 rounded-sm -rotate-2"></div>
        <div class="flex items-center justify-between pb-2.5">
          <span class="px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase" style="background:${badgeBg}; color:${badgeInk}">${escapeHtml(badge)}</span>
          <span class="font-mono text-[11px] font-bold">★ LIVE GIF LOOP</span>
        </div>
        <div class="relative w-full rounded-2xl border-[3px] th-border bg-[#121212] overflow-hidden flex items-center justify-center">
          ${mediaInner}
          <div class="absolute bottom-3 right-3 px-3 py-1 rounded-full border-2 th-border font-mono text-[10px] font-bold uppercase -rotate-2" style="background:${expTheme.popLime}; color:${expTheme.popLimeInk}">${escapeHtml(caption)}</div>
        </div>
      </div>`;
  };

  const stats = issue.encounter.impel_ratings || {
    strength: 5,
    speed: 5,
    energy: 6,
    psychic: 5,
  };
  const formattedNum = String(issue.issueNumber).padStart(2, '0');
  const heroPoster = encodedShots[2] || encodedShots[0] || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>199X ZINE ISSUE #${formattedNum} // ${escapeHtml(issue.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: ${expTheme.paperBg};
      color: ${expTheme.ink};
      background-image: ${expTheme.bgImage};
      background-size: ${expTheme.bgSize};
    }
    .font-display { font-family: 'Bricolage Grotesque', sans-serif; }
    .font-mono { font-family: 'Space Mono', monospace; }
    .th-border { border-color: ${expTheme.borderColor} !important; }
    .th-surface { background-color: ${expTheme.surfaceBg}; color: ${expTheme.ink}; }
    .th-elevated { background-color: ${expTheme.surfaceElevated}; color: ${expTheme.ink}; }
    .pop-card {
      border: 3px solid ${expTheme.borderColor};
      box-shadow: 6px 6px 0px ${expTheme.shadowColor};
      border-radius: 20px;
    }
    .pop-btn {
      border: 2.5px solid ${expTheme.borderColor};
      box-shadow: 4px 4px 0px ${expTheme.shadowColor};
      border-radius: 14px;
      transition: all 0.12s ease;
    }
    .pop-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px ${expTheme.shadowColor}; }
    .washi-tape {
      background: repeating-linear-gradient(-45deg, rgba(255,230,0,0.9), rgba(255,230,0,0.9) 8px, rgba(255,255,255,0.85) 8px, rgba(255,255,255,0.85) 16px);
      border: 2px solid ${expTheme.borderColor};
    }
    @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
    .marquee-track { display: flex; width: max-content; animation: marquee 24s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .spinning { animation: spin 4s linear infinite; }
    @keyframes kenBurnsLoop {
      0%   { transform: scale(1.03) translate(0%, 0%); }
      50%  { transform: scale(1.1) translate(-1.5%, -1%); }
      100% { transform: scale(1.03) translate(0%, 0%); }
    }
    .auto-motion-loop { animation: kenBurnsLoop 8s ease-in-out infinite; }
    .card-3d-wrap { perspective: 1200px; }
    .card-3d-inner { transition: transform 0.65s cubic-bezier(0.22,1,0.36,1); transform-style: preserve-3d; position: relative; }
    .card-3d-inner.flipped { transform: rotateY(180deg); }
    .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
    .card-face-back { transform: rotateY(180deg); position: absolute; inset: 0; }
    @keyframes holoShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .holo-glitter {
      background:
        radial-gradient(circle at 18% 22%, rgba(255,255,255,0.9) 0, transparent 2.5px),
        radial-gradient(circle at 82% 14%, rgba(255,230,0,0.95) 0, transparent 3px),
        radial-gradient(circle at 64% 78%, rgba(0,240,255,0.9) 0, transparent 2.5px),
        repeating-conic-gradient(from 15deg at 50% 50%, #ff2a85 0deg, #ffe600 45deg, #00f0ff 90deg, #b8ff00 135deg, #a855f7 180deg, #ff2a85 225deg, #ffe600 270deg, #00f0ff 315deg, #ff2a85 360deg);
      background-size: 38px 38px, 44px 44px, 34px 34px, 240% 240%;
      animation: holoShift 7s ease-in-out infinite;
    }
    .holo-silver {
      background: linear-gradient(125deg, #d4d4d8 0%, #fff 14%, #7dd3fc 28%, #f9a8d4 42%, #fef08a 56%, #a5f3fc 70%, #c084fc 85%, #f4f4f5 100%);
      background-size: 260% 260%;
      animation: holoShift 6s ease-in-out infinite;
    }
    .holo-prism {
      background: repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 10px),
        linear-gradient(115deg, #00f0ff 0%, #ff0099 25%, #ffe600 50%, #39ff14 75%, #7b00ff 100%);
      background-size: 100% 100%, 280% 280%;
      animation: holoShift 5.5s ease-in-out infinite;
    }
    .holo-pill { background: linear-gradient(115deg, #cbd5e1 0%, #fff 25%, #93c5fd 50%, #f9a8d4 75%, #fde047 100%); background-size: 220% 220%; animation: holoShift 5s ease-in-out infinite; }
    .gold-arcade { background: linear-gradient(180deg, #fff6a8 0%, #facc15 50%, #ef4444 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .silver-bevel { background: linear-gradient(180deg, #fff 0%, #cbd5e1 48%, #818cf8 80%, #f8fafc 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  </style>
</head>
<body class="min-h-screen p-4 sm:p-8 lg:p-10">
  ${encodedAudio ? `<audio id="zineAudio" src="${encodedAudio}" autoplay loop></audio>` : ''}

  <main class="max-w-[1440px] mx-auto space-y-10">
    <!-- 1. HERO LEAD: 16:9 1080P CINEMA + DOCKED SPINNING VINYL BOOMBOX -->
    <section class="space-y-5">
      <div class="pop-card th-surface overflow-hidden">
        <div class="px-4 py-2.5 border-b-[3px] th-border flex items-center justify-between" style="background:${expTheme.popCyan}; color:${expTheme.popCyanInk}">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-full bg-[#FF2A85] border-2 border-[#121212]"></span>
            <span class="w-3.5 h-3.5 rounded-full bg-[#FFE600] border-2 border-[#121212]"></span>
            <span class="w-3.5 h-3.5 rounded-full bg-[#B8FF00] border-2 border-[#121212]"></span>
            <span class="font-mono text-xs font-bold uppercase ml-1">🎬 199X FEATURE PRESENTATION // 1080P HERO CINEMA</span>
          </div>
          <button onclick="const v=document.getElementById('heroVid'); if(v&&v.requestFullscreen) v.requestFullscreen();" class="px-2.5 py-1 rounded-lg border-2 th-border th-elevated font-mono text-[11px] font-bold uppercase cursor-pointer">
            FULLSCREEN ⤢
          </button>
        </div>
        <div class="relative aspect-video w-full bg-[#121212] overflow-hidden">
          ${
            encodedVideo
              ? `<video id="heroVid" src="${encodedVideo}" ${heroPoster ? `poster="${heroPoster}"` : ''} autoplay loop muted playsinline controls class="w-full h-full object-cover"></video>`
              : heroPoster
              ? `<img id="heroVid" src="${heroPoster}" class="w-full h-full object-cover auto-motion-loop" />`
              : `<div class="w-full h-full flex items-center justify-center text-white font-mono">199X HERO CINEMA</div>`
          }
        </div>
      </div>

      <!-- DOCKED VINYL BOOMBOX -->
      <div class="pop-card p-5 flex flex-col sm:flex-row items-center gap-4" style="background:${expTheme.tile2}; color:${expTheme.ink}">
        <div class="flex items-center gap-3 shrink-0">
          <button id="playBtn" onclick="toggleSong()" class="pop-btn px-5 py-3 font-display font-extrabold text-sm uppercase cursor-pointer" style="background:${expTheme.popPink}; color:${expTheme.popPinkInk}">
            ▶ PLAY SONG
          </button>
          <div id="vinylDisc" class="w-11 h-11 rounded-full border-[3px] th-border bg-[#121212] flex items-center justify-center">
            <div class="w-4 h-4 rounded-full border-2 border-[#121212]" style="background:${expTheme.heroYellow}"></div>
          </div>
        </div>
        <div class="flex-1 w-full min-w-0 space-y-1.5">
          <div class="flex justify-between text-xs font-bold">
            <span class="truncate">🎵 ${escapeHtml(issue.audioTitle || '199X Suburban Synthwave Track')}</span>
            <span id="songClock" class="font-mono text-[11px]">0:00</span>
          </div>
          <input id="songSeek" type="range" min="0" max="100" value="0" step="0.1" style="accent-color:${expTheme.popPink}" class="w-full cursor-pointer" />
        </div>
        <canvas id="specCanvas" width="156" height="42" style="background:${expTheme.inputBg}" class="w-[156px] h-[42px] rounded-xl border-2 th-border p-1 shrink-0"></canvas>
      </div>
    </section>

    <!-- 2. COVER MASTHEAD -->
    <header class="relative pop-card p-6 sm:p-9 overflow-hidden" style="background:${expTheme.mastheadBg}; color:${expTheme.ink}">
      <div class="pointer-events-none absolute -right-12 -top-12 w-52 h-52 rounded-full border-[3px] th-border" style="background:${expTheme.popPink}"></div>
      <div class="pointer-events-none absolute right-24 -bottom-10 w-28 h-28 rounded-full border-[3px] th-border" style="background:${expTheme.popCyan}"></div>
      <div class="relative z-10 space-y-4">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="px-3.5 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase -rotate-2" style="background:${expTheme.popPink}; color:${expTheme.popPinkInk}">
            ★ ISSUE #${formattedNum} // ${escapeHtml(issue.classification)}
          </span>
          <span class="px-3 py-1 rounded-full border-2 th-border th-elevated font-mono text-xs font-bold uppercase rotate-1">
            📍 ${escapeHtml(issue.sectorTag)}
          </span>
          <span class="px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase" style="background:${expTheme.popCyan}; color:${expTheme.popCyanInk}">
            SEED: ${escapeHtml(issue.hexSeed)}
          </span>
        </div>
        <h1 style="text-shadow:${expTheme.titleShadow}" class="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.94] max-w-4xl">
          ${escapeHtml(issue.title)}
        </h1>
        <div class="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold">
          <span class="px-3 py-1.5 rounded-xl border-2 th-border th-elevated">📍 Location: ${escapeHtml(issue.location)}</span>
          <span class="px-3 py-1.5 rounded-xl border-2 th-border" style="background:${expTheme.popLime}; color:${expTheme.popLimeInk}">🛠️ Gear: ${escapeHtml(issue.artifact)} + ${escapeHtml(issue.weapon)}</span>
          <span class="px-3 py-1.5 rounded-xl border-2 th-border th-elevated">👾 Anomaly: ${escapeHtml(issue.anomalyName)}</span>
        </div>
      </div>
    </header>

    <!-- 3. MARQUEE TICKER -->
    <div class="pop-card py-2.5 overflow-hidden" style="background:${expTheme.tickerBg}; color:${expTheme.heroYellow}">
      <div class="marquee-track font-mono text-xs sm:text-sm font-bold uppercase tracking-widest">
        <span class="mx-6">★ 199X SERIES 2 ZINE ISSUE ★ SYNERGY: ${escapeHtml(issue.synergy)} ★ DEBUFF: ${escapeHtml(issue.encounter.status_affliction)} ★ CLICK TRADING CARD TO 3D FLIP ★</span>
        <span class="mx-6">★ 199X SERIES 2 ZINE ISSUE ★ SYNERGY: ${escapeHtml(issue.synergy)} ★ DEBUFF: ${escapeHtml(issue.encounter.status_affliction)} ★ CLICK TRADING CARD TO 3D FLIP ★</span>
      </div>
    </div>

    <!-- 4. SPREAD 01: ACT I + SHOT 01 + OPTIONAL STORY GIF #1 -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <article class="lg:col-span-5 pop-card p-6 sm:p-7" style="background:${expTheme.tile1}; color:${expTheme.ink}">
        <span class="inline-block px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase mb-3" style="background:${expTheme.heroYellow}; color:${expTheme.heroYellowInk}">ACT 01 // THE SETUP</span>
        <h2 class="font-display text-2xl sm:text-3xl font-extrabold uppercase mb-4">Entering ${escapeHtml(issue.location)}</h2>
        <p class="text-base sm:text-[17px] leading-[1.75] font-medium whitespace-pre-line">${escapeHtml(issue.acts.sceneSetup)}</p>
      </article>
      <div class="lg:col-span-7 space-y-6">
        ${
          encodedShots[0]
            ? `<div onclick="openLightbox(${presentGallery.indexOf(encodedShots[0])})" class="pop-card th-surface p-2.5 sm:p-3 cursor-pointer">
                <div class="aspect-[16/10] rounded-xl border-2 th-border overflow-hidden bg-[#121212]"><img src="${encodedShots[0]}" class="w-full h-full object-cover" /></div>
                <div class="pt-3 flex justify-between items-center">
                  <span class="px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase" style="background:${expTheme.popCyan}; color:${expTheme.popCyanInk}">🌍 IMAGE 01 // HERO ARRIVES</span>
                  <span class="font-mono text-xs font-bold underline">Pop Open 2K ⤢</span>
                </div>
              </div>`
            : ''
        }
        ${renderGifBlockHtml(encodedGif1, '🎞️ STORY GIF 01 // ACT I TENSION LOOP', expTheme.popPink, expTheme.popPinkInk, 'ACT I MOTION ∞', '0.8deg')}
      </div>
    </section>

    <!-- 5. SPREAD 02 (REVERSED): SHOT 02 + TILTED SHOT 03 (LEFT) × ACT II + GEAR NOTES (RIGHT) -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div class="lg:col-span-7 space-y-6 order-2 lg:order-1">
        ${
          encodedShots[1]
            ? `<div onclick="openLightbox(${presentGallery.indexOf(encodedShots[1])})" class="pop-card th-surface p-2.5 sm:p-3 cursor-pointer lg:-rotate-[1deg] hover:rotate-0 transition-transform">
                <div class="aspect-[16/10] rounded-xl border-2 th-border overflow-hidden bg-[#121212]"><img src="${encodedShots[1]}" class="w-full h-full object-cover" /></div>
                <div class="pt-3 flex justify-between items-center">
                  <span class="px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase" style="background:${expTheme.popPink}; color:${expTheme.popPinkInk}">👾 IMAGE 02 // BAD GUY VILLAIN REVEAL</span>
                  <span class="font-mono text-xs font-bold underline">Pop Open 2K ⤢</span>
                </div>
              </div>`
            : ''
        }
        ${
          encodedShots[2]
            ? `<div onclick="openLightbox(${presentGallery.indexOf(encodedShots[2])})" class="w-full pop-card th-surface p-2.5 sm:p-3 cursor-pointer lg:rotate-[1.2deg] hover:rotate-0 transition-transform">
                <div class="aspect-[16/10] rounded-xl border-2 th-border overflow-hidden bg-[#121212]"><img src="${encodedShots[2]}" class="w-full h-full object-cover" /></div>
                <div class="pt-2.5 flex justify-between items-center">
                  <span class="px-2.5 py-0.5 rounded-full border-2 th-border font-mono text-[11px] font-bold uppercase" style="background:${expTheme.heroYellow}; color:${expTheme.heroYellowInk}">⚡ IMAGE 03 // GOOD GUY VS. BAD GUY</span>
                  <span class="font-mono text-[11px] font-bold">2K ⤢</span>
                </div>
              </div>`
            : ''
        }
      </div>
      <div class="lg:col-span-5 space-y-6 order-1 lg:order-2">
        <article class="pop-card p-6 sm:p-7" style="background:${expTheme.tile2}; color:${expTheme.ink}">
          <span class="inline-block px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase mb-3" style="background:${expTheme.popPink}; color:${expTheme.popPinkInk}">ACT 02 // KINETIC CLASH</span>
          <h2 class="font-display text-2xl sm:text-3xl font-extrabold uppercase mb-4">${escapeHtml(issue.synergy)}</h2>
          <p class="text-base sm:text-[17px] leading-[1.75] font-medium whitespace-pre-line">${escapeHtml(issue.acts.intervention)}</p>
        </article>
        <div class="pop-card th-surface p-5 space-y-2.5 text-xs">
          <div class="font-display text-lg font-extrabold uppercase">🎒 199X Gear &amp; Synergy Field Notes</div>
          <div class="p-3 rounded-xl border-2 th-border" style="background:${expTheme.tile1}"><strong>Retro Artifact:</strong> ${escapeHtml(issue.artifact)}</div>
          <div class="p-3 rounded-xl border-2 th-border" style="background:${expTheme.tile3}"><strong>Improvised Weapon:</strong> ${escapeHtml(issue.weapon)}</div>
          <div class="p-3 rounded-xl border-2 th-border" style="background:${expTheme.tile4}"><strong>Synergy Trigger:</strong> ${escapeHtml(issue.synergy)}</div>
        </div>
      </div>
    </section>

    <!-- 6. SPREAD 03: ACT III (LEFT) + SHOT 04 & OPTIONAL STORY GIF #2 (RIGHT) -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <article class="lg:col-span-5 pop-card p-6 sm:p-7" style="background:${expTheme.tile3}; color:${expTheme.ink}">
        <span class="inline-block px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase mb-3" style="background:${expTheme.popLime}; color:${expTheme.popLimeInk}">ACT 03 // THE AFTERMATH</span>
        <h2 class="font-display text-2xl sm:text-3xl font-extrabold uppercase mb-4">Suburban Stillness Restored</h2>
        <p class="text-base sm:text-[17px] leading-[1.75] font-medium whitespace-pre-line">${escapeHtml(issue.acts.aftermath)}</p>
      </article>
      <div class="lg:col-span-7 space-y-6">
        ${
          encodedShots[3]
            ? `<div onclick="openLightbox(${presentGallery.indexOf(encodedShots[3])})" class="pop-card th-surface p-2.5 sm:p-3 cursor-pointer">
                <div class="aspect-[16/10] rounded-xl border-2 th-border overflow-hidden bg-[#121212]"><img src="${encodedShots[3]}" class="w-full h-full object-cover" /></div>
                <div class="pt-3 flex justify-between items-center">
                  <span class="px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase" style="background:${expTheme.popLime}; color:${expTheme.popLimeInk}">🌅 IMAGE 04 // ACT III AFTERMATH</span>
                  <span class="font-mono text-xs font-bold underline">Pop Open 2K ⤢</span>
                </div>
              </div>`
            : ''
        }
        ${renderGifBlockHtml(encodedGif2, '🎞️ STORY GIF 02 // ACT III AFTERMATH LOOP', expTheme.popCyan, expTheme.popCyanInk, 'ACT III MOTION ∞', '-0.8deg')}
      </div>
    </section>

    ${
      encodedOutroVideo
        ? `<!-- 6.5 ACT III FINALE VIDEO (CLOSING THE TALE) -->
    <section class="pop-card th-surface overflow-hidden">
      <div class="px-4 py-2.5 border-b-[3px] th-border flex items-center justify-between" style="background:${expTheme.popPink}; color:${expTheme.popPinkInk}">
        <span class="font-mono text-xs font-bold uppercase">🎬 ACT III FINALE VIDEO // CLOSING THE TALE</span>
        <button onclick="const v=document.getElementById('outroVid'); if(v&&v.requestFullscreen) v.requestFullscreen();" class="px-2.5 py-1 rounded-lg border-2 th-border th-elevated font-mono text-[11px] font-bold uppercase cursor-pointer">FULLSCREEN ⤢</button>
      </div>
      <div class="relative aspect-video w-full bg-[#121212] overflow-hidden">
        <video id="outroVid" src="${encodedOutroVideo}" ${encodedShots[3] ? `poster="${encodedShots[3]}"` : ''} autoplay loop muted playsinline controls class="w-full h-full object-cover"></video>
      </div>
    </section>`
        : ''
    }

    <!-- 7. 3-CARD HOLOGRAPHIC BOOSTER PACK (DISC-GOLF FOIL STYLE!) -->
    <section class="pop-card th-surface p-5 sm:p-8 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="inline-block px-3 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase mb-2" style="background:${expTheme.heroYellow}; color:${expTheme.heroYellowInk}">✨ ISSUE #${formattedNum} HOLOGRAPHIC BOOSTER PACK (3 CARDS)</span>
          <h2 class="font-display text-2xl sm:text-4xl font-extrabold uppercase">Crystallized Aftermath Collector Cards</h2>
          <p style="color:${expTheme.mutedInk}" class="text-xs sm:text-sm font-semibold">Click any holographic foil card below to flip 180° for its field dossier.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 place-items-center">
        <!-- CARD 1: HERO OPERATIVE (SUGAR HIGH GLITTER-SWIRL FOIL) -->
        <div onclick="document.getElementById('holoCard1').classList.toggle('flipped')" class="card-3d-wrap w-full max-w-[320px] aspect-[5/7] cursor-pointer">
          <div id="holoCard1" class="card-3d-inner w-full h-full">
            <div class="card-face w-full h-full rounded-[18px] p-[11px] holo-glitter shadow-2xl">
              <div class="w-full h-full rounded-[12px] bg-[#0e0f14] border-2 border-black p-2.5 flex flex-col justify-between text-white">
                <div>
                  <div class="flex justify-between text-[10px] font-mono font-black gold-arcade"><span>199X OPERATIVE</span><span>#${formattedNum}-A</span></div>
                  <div class="font-display font-black text-xl uppercase leading-tight truncate gold-arcade">${escapeHtml(issue.characterName)}</div>
                </div>
                <div class="relative flex-1 my-1.5 rounded-[10px] border-2 border-zinc-400/70 bg-black overflow-hidden">
                  ${(encodedShots[2] || encodedShots[0] || cardImg) ? `<img src="${encodedShots[2] || encodedShots[0] || cardImg}" class="w-full h-full object-cover" />` : ''}
                  <div class="absolute bottom-2 left-2 right-2 rounded-xl border-2 border-black holo-pill p-1 flex items-center gap-1.5">
                    <div class="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-tr from-purple-900 via-cyan-400 to-yellow-300 shrink-0"></div>
                    <div class="flex-1">
                      <div class="text-[8px] font-mono font-black text-black text-center leading-none mb-0.5">199X POWER STATS</div>
                      <div class="grid grid-cols-4 bg-black rounded px-1 py-0.5 font-mono font-black text-xs text-center">
                        <span class="text-yellow-300">${stats.strength}</span><span class="text-sky-400">${Math.min(9, stats.speed + 1)}</span><span class="text-pink-500">${stats.energy}</span><span class="text-lime-400">${stats.psychic}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex justify-between text-[10px] font-display font-black uppercase italic"><span class="text-amber-300">199X SERIES 2</span><span class="text-sky-400">HERO OPERATIVE</span></div>
              </div>
            </div>
            <div class="card-face card-face-back w-full h-full rounded-[18px] p-[11px] holo-glitter shadow-2xl">
              <div class="w-full h-full rounded-[12px] bg-[#10121b] border-2 border-black p-3.5 flex flex-col justify-between text-white text-xs">
                <div>
                  <div class="flex justify-between font-mono text-[10px] border-b border-white/15 pb-1 mb-2"><span class="px-2 py-0.5 bg-yellow-400 text-black font-black rounded">#${formattedNum}-A</span><span class="text-cyan-300 font-bold">↻ FLIP</span></div>
                  <div class="font-display font-black text-base text-yellow-300 uppercase mb-1">${escapeHtml(issue.characterFull)}</div>
                  <p class="text-[11px] text-zinc-200 leading-relaxed">${escapeHtml(issue.acts.intervention.split('\n\n')[0] || issue.encounter.cosmic_distortion)}</p>
                </div>
                <div class="space-y-1 font-mono text-[10px]">
                  <div class="p-1.5 rounded bg-black/70 border border-white/15">WEAPON: ${escapeHtml(issue.weapon)}</div>
                  <div class="p-1.5 rounded bg-black/70 border border-white/15">RELIC: ${escapeHtml(issue.artifact)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 2: BAD GUY ANOMALY (HALO SILVER DIAMOND CREST FOIL) -->
        <div onclick="document.getElementById('holoCard2').classList.toggle('flipped')" class="card-3d-wrap w-full max-w-[320px] aspect-[5/7] cursor-pointer">
          <div id="holoCard2" class="card-3d-inner w-full h-full">
            <div class="card-face w-full h-full rounded-[18px] p-[11px] holo-silver shadow-2xl">
              <div class="w-full h-full rounded-[10px] border-2 border-black bg-[#161925] p-[5px]">
                <div class="w-full h-full rounded-[7px] border border-yellow-500/80 bg-[#171d2d] flex flex-col justify-between overflow-hidden">
                  <div class="px-2.5 py-2 bg-gradient-to-b from-[#1e2640] to-[#111526] border-b-2 border-yellow-500/70 flex items-center gap-2.5">
                    <div class="w-9 h-9 rotate-45 bg-gradient-to-br from-yellow-200 via-yellow-500 to-amber-700 border-2 border-black shrink-0 flex items-center justify-center">
                      <div class="-rotate-45 grid grid-cols-2 text-[9px] font-mono font-black text-black leading-none text-center w-full p-0.5">
                        <span>${Math.min(9, stats.strength + 1)}</span><span>${stats.speed}</span><span>${Math.min(9, stats.energy + 1)}</span><span>${Math.min(9, stats.psychic + 1)}</span>
                      </div>
                    </div>
                    <div class="min-w-0">
                      <div class="text-[9px] font-mono font-bold text-cyan-300 uppercase">OMEGA ANOMALY</div>
                      <div class="font-display font-black text-lg uppercase leading-none truncate silver-bevel">${escapeHtml(issue.anomalyName)}</div>
                    </div>
                  </div>
                  <div class="flex-1 m-1.5 rounded border-2 border-black bg-black overflow-hidden">
                    ${(encodedShots[1] || cardImg) ? `<img src="${encodedShots[1] || cardImg}" class="w-full h-full object-cover" />` : ''}
                  </div>
                  <div class="mx-1.5 mb-1.5 px-2 py-1.5 rounded border-2 border-black bg-[#f3ead1] text-black text-center font-mono font-black text-[10px]">
                    STR ${Math.min(9, stats.strength + 1)} - SPD ${stats.speed} - ENG ${Math.min(9, stats.energy + 1)} - PSY ${Math.min(9, stats.psychic + 1)}
                  </div>
                </div>
              </div>
            </div>
            <div class="card-face card-face-back w-full h-full rounded-[18px] p-[11px] holo-silver shadow-2xl">
              <div class="w-full h-full rounded-[12px] bg-[#10121b] border-2 border-black p-3.5 flex flex-col justify-between text-white text-xs">
                <div>
                  <div class="flex justify-between font-mono text-[10px] border-b border-white/15 pb-1 mb-2"><span class="px-2 py-0.5 bg-pink-600 text-white font-black rounded">#${formattedNum}-B</span><span class="text-cyan-300 font-bold">↻ FLIP</span></div>
                  <div class="font-display font-black text-base text-pink-300 uppercase mb-1">${escapeHtml(issue.anomalyName)}</div>
                  <p class="text-[11px] text-zinc-200 leading-relaxed">${escapeHtml(issue.encounter.cosmic_distortion)}</p>
                </div>
                <div class="space-y-1 font-mono text-[10px]">
                  <div class="p-1.5 rounded bg-black/70 border border-white/15">SECTOR: ${escapeHtml(issue.location)}</div>
                  <div class="p-1.5 rounded bg-black/70 border border-white/15">DEBUFF: ${escapeHtml(issue.encounter.status_affliction)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD 3: SYNERGY RELIC FOIL (CRACKED PRISM FOIL) -->
        <div onclick="document.getElementById('holoCard3').classList.toggle('flipped')" class="card-3d-wrap w-full max-w-[320px] aspect-[5/7] cursor-pointer">
          <div id="holoCard3" class="card-3d-inner w-full h-full">
            <div class="card-face w-full h-full rounded-[18px] p-[11px] holo-prism shadow-2xl">
              <div class="w-full h-full rounded-[12px] bg-[#0e0f14] border-2 border-black p-2.5 flex flex-col justify-between text-white">
                <div>
                  <div class="flex justify-between text-[10px] font-mono font-black gold-arcade"><span>SYNERGY RELIC FOIL</span><span>#${formattedNum}-C</span></div>
                  <div class="font-display font-black text-xl uppercase leading-tight truncate gold-arcade">${escapeHtml(issue.synergy)}</div>
                </div>
                <div class="relative flex-1 my-1.5 rounded-[10px] border-2 border-zinc-400/70 bg-black overflow-hidden">
                  ${(encodedShots[3] || encodedShots[0] || cardImg) ? `<img src="${encodedShots[3] || encodedShots[0] || cardImg}" class="w-full h-full object-cover" />` : ''}
                  <div class="absolute bottom-2 left-2 right-2 rounded-xl border-2 border-black holo-pill p-1 flex items-center gap-1.5">
                    <div class="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-tr from-pink-600 via-yellow-400 to-cyan-400 shrink-0"></div>
                    <div class="flex-1">
                      <div class="text-[8px] font-mono font-black text-black text-center leading-none mb-0.5">SYNERGY RESONANCE</div>
                      <div class="grid grid-cols-4 bg-black rounded px-1 py-0.5 font-mono font-black text-xs text-center">
                        <span class="text-yellow-300">${stats.strength}</span><span class="text-sky-400">${stats.speed}</span><span class="text-pink-500">${Math.min(9, stats.energy + 2)}</span><span class="text-lime-400">${Math.min(9, stats.psychic + 1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex justify-between text-[10px] font-display font-black uppercase italic"><span class="text-amber-300">199X ARTIFACT</span><span class="text-sky-400">HOLO INSERT</span></div>
              </div>
            </div>
            <div class="card-face card-face-back w-full h-full rounded-[18px] p-[11px] holo-prism shadow-2xl">
              <div class="w-full h-full rounded-[12px] bg-[#10121b] border-2 border-black p-3.5 flex flex-col justify-between text-white text-xs">
                <div>
                  <div class="flex justify-between font-mono text-[10px] border-b border-white/15 pb-1 mb-2"><span class="px-2 py-0.5 bg-cyan-400 text-black font-black rounded">#${formattedNum}-C</span><span class="text-cyan-300 font-bold">↻ FLIP</span></div>
                  <div class="font-display font-black text-base text-cyan-300 uppercase mb-1">${escapeHtml(issue.artifact)} + ${escapeHtml(issue.weapon)}</div>
                  <p class="text-[11px] text-zinc-200 leading-relaxed">${escapeHtml(issue.acts.aftermath.split('\n\n')[0] || issue.encounter.cosmic_distortion)}</p>
                </div>
                <div class="space-y-1 font-mono text-[10px]">
                  <div class="p-1.5 rounded bg-black/70 border border-white/15">SYNERGY: ${escapeHtml(issue.synergy)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- 2K LIGHTBOX MODAL -->
  <div id="lightbox" onclick="closeLb()" class="fixed inset-0 z-50 hidden bg-[#121212]/90 items-center justify-center p-4 sm:p-8">
    <div onclick="event.stopPropagation()" class="max-w-[94vw] w-full pop-card th-surface p-4 space-y-3">
      <div class="flex justify-between items-center">
        <span id="lbTitle" class="px-3.5 py-1 rounded-full border-2 th-border font-mono text-xs font-bold uppercase" style="background:${expTheme.heroYellow}; color:${expTheme.heroYellowInk}">SHOT</span>
        <div class="flex gap-2">
          <button onclick="stepLb(-1)" class="pop-btn px-3 py-1 th-elevated font-mono text-xs font-bold cursor-pointer">◀ PREV</button>
          <button onclick="stepLb(1)" class="pop-btn px-3 py-1 th-elevated font-mono text-xs font-bold cursor-pointer">NEXT ▶</button>
          <button onclick="closeLb()" class="pop-btn px-3 py-1 font-mono text-xs font-bold cursor-pointer" style="background:${expTheme.popPink}; color:${expTheme.popPinkInk}">✕ CLOSE</button>
        </div>
      </div>
      <div class="rounded-xl border-[3px] th-border bg-[#121212] flex justify-center overflow-hidden">
        <img id="lbImg" src="" class="max-h-[86vh] w-auto object-contain" />
      </div>
    </div>
  </div>

  <script>
    const imgs = ${JSON.stringify(presentGallery)};
    let cur = 0;
    function openLightbox(i) {
      if (!imgs.length || i < 0) return;
      cur = i;
      document.getElementById('lbImg').src = imgs[cur];
      document.getElementById('lbTitle').textContent = 'SHOT 0' + (cur + 1) + ' / 0' + imgs.length;
      const lb = document.getElementById('lightbox');
      lb.classList.remove('hidden'); lb.classList.add('flex');
    }
    function closeLb() {
      const lb = document.getElementById('lightbox');
      lb.classList.add('hidden'); lb.classList.remove('flex');
    }
    function stepLb(d) {
      if (!imgs.length) return;
      cur = (cur + d + imgs.length) % imgs.length;
      openLightbox(cur);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') stepLb(1);
      if (e.key === 'ArrowLeft') stepLb(-1);
    });

    const audio = document.getElementById('zineAudio');
    const playBtn = document.getElementById('playBtn');
    const vinyl = document.getElementById('vinylDisc');
    const seek = document.getElementById('songSeek');
    const clock = document.getElementById('songClock');
    let audioCtx, analyser, playing = false;

    function fmt(s) {
      if (!isFinite(s) || s < 0) return '0:00';
      return Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0');
    }

    let userPaused = false;
    function connectAnalyserSafe() {
      if (!audio || audioCtx) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        if (ctx.state === 'suspended') ctx.resume();
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        const src = ctx.createMediaElementSource(audio);
        src.connect(an);
        an.connect(ctx.destination);
        audioCtx = ctx;
        analyser = an;
      } catch(e) {}
    }

    function toggleSong() {
      if (!audio) return;
      if (audio.paused) {
        userPaused = false;
        connectAnalyserSafe();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        audio.play().catch(() => {});
        playing = true;
        playBtn.textContent = '⏸ PAUSE';
        vinyl.classList.add('spinning');
      } else {
        userPaused = true;
        audio.pause();
        playing = false;
        playBtn.textContent = '▶ PLAY SONG';
        vinyl.classList.remove('spinning');
      }
    }

    if (audio) {
      audio.loop = true;
      audio.addEventListener('play', () => {
        playing = true;
        playBtn.textContent = '⏸ PAUSE';
        vinyl.classList.add('spinning');
      });
      audio.addEventListener('pause', () => {
        playing = false;
        playBtn.textContent = '▶ PLAY SONG';
        vinyl.classList.remove('spinning');
      });
      audio.addEventListener('timeupdate', () => {
        if (audio.duration) seek.value = (audio.currentTime / audio.duration) * 100;
        clock.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
      });
      seek.addEventListener('input', (e) => {
        if (audio.duration) audio.currentTime = (Number(e.target.value) / 100) * audio.duration;
      });

      // Auto-play on Zine open + first-touch unlock fallback for mobile browsers
      audio.play().then(() => { connectAnalyserSafe(); }).catch(() => {});
      const unlockAudio = () => {
        if (audio && audio.paused && !userPaused) {
          audio.play().then(() => { connectAnalyserSafe(); }).catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    }

    const sc = document.getElementById('specCanvas');
    if (sc) {
      const ctx = sc.getContext('2d');
      const cols = [${JSON.stringify(expTheme.popPink)}, ${JSON.stringify(expTheme.heroYellow)}, ${JSON.stringify(expTheme.popCyan)}, ${JSON.stringify(expTheme.popLime)}];
      const fdata = new Uint8Array(64);
      let tick = 0;
      function draw() {
        tick += 0.08;
        ctx.clearRect(0, 0, sc.width, sc.height);
        if (analyser && playing) analyser.getByteFrequencyData(fdata);
        const bars = 28, gap = 3, bw = (sc.width - gap*(bars-1))/bars;
        for (let i=0; i<bars; i++) {
          let r = 0.16 + 0.06*Math.sin(tick + i*0.4);
          if (analyser && playing) r = Math.max(0.14, fdata[i]/255);
          else if (playing) r = 0.25 + 0.6*Math.abs(Math.sin(tick*2 + i*0.4));
          const h = Math.max(5, r*(sc.height-4));
          ctx.fillStyle = cols[i % cols.length];
          ctx.fillRect(i*(bw+gap), sc.height-h, bw, h);
          ctx.strokeStyle = ${JSON.stringify(expTheme.borderColor)};
          ctx.lineWidth = 1.2;
          ctx.strokeRect(i*(bw+gap), sc.height-h, bw, h);
        }
        requestAnimationFrame(draw);
      }
      draw();
    }
  </script>
</body>
</html>`;

  const safeSlug = issue.title
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const dlUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = dlUrl;
  link.download = `199X_ZINE_ISSUE_${formattedNum}_${safeSlug || 'CHRONICLE'}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(dlUrl), 5000);
}
