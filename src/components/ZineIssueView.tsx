import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Film,
  Disc3,
  Image as ImageIcon,
  Copy,
  Check,
  Upload,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';
import { ZineIssueData } from '../engine/zineEngine';
import { ZINE_PALETTES, ZinePaletteId, getZinePalette } from '../data/zinePalettes';
import { StudioUiTheme } from '../data/uiThemes';
import {
  playZineBlip,
  playZineResonanceChime,
  playProcedural199xSongPreview,
} from '../utils/audio';
import { exportStandaloneZineHtml } from '../utils/zineHtmlExporter';
import { TradingCardVisual } from './TradingCardVisual';
import { HoloBoosterPack } from './HoloBoosterPack';

export type ZineMediaSlotKey =
  | 'video'
  | 'outroVideo'
  | 'audio'
  | 'gif1'
  | 'gif2'
  | 'shot0'
  | 'shot1'
  | 'shot2'
  | 'shot3';

interface ZineIssueViewProps {
  issue: ZineIssueData;
  onUpdatePalette?: (paletteId: ZinePaletteId) => void;
  onDropSlotFile?: (slot: ZineMediaSlotKey, file: File) => void;
  onClickUploadSlot?: (slot: ZineMediaSlotKey) => void;
  onSaveToShelf?: () => Promise<void> | void;
  isSavingShelf?: boolean;
  isSavedOnShelf?: boolean;
  onExportForDrive?: () => Promise<void> | void;
  onAiRewriteStory?: () => Promise<void> | void;
  isAiRewriting?: boolean;
  uiTheme?: StudioUiTheme;
  readerMode?: boolean;
}

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SHOT_STICKERS = [
  { badge: '🌍 IMAGE 01 // HERO ARRIVES IN SECTOR', note: 'Act 01 Setup • Same Locked Hero' },
  { badge: '👾 IMAGE 02 // BAD GUY VILLAIN REVEAL', note: 'Act 01→02 Anomaly Emergence' },
  { badge: '⚡ IMAGE 03 // GOOD GUY VS. BAD GUY', note: 'Act 02 Showdown Splash' },
  { badge: '🌅 IMAGE 04 // ACT III AFTERMATH', note: 'Act 03 Gear & Foil Card' },
];

export const ZineIssueView: React.FC<ZineIssueViewProps> = ({
  issue,
  onUpdatePalette,
  onDropSlotFile,
  onClickUploadSlot,
  onSaveToShelf,
  isSavingShelf = false,
  isSavedOnShelf = false,
  onExportForDrive,
  onAiRewriteStory,
  isAiRewriting = false,
  uiTheme,
  readerMode = false,
}) => {
  const pal = getZinePalette(issue.zinePaletteId);
  const [vibeCustomized, setVibeCustomized] = useState(false);
  const [inlineCopiedSlot, setInlineCopiedSlot] = useState<string | null>(null);
  const [dragHoverSlot, setDragHoverSlot] = useState<ZineMediaSlotKey | null>(null);
  const [showBonusCard, setShowBonusCard] = useState(false);

  const copyInlinePrompt = async (slotId: string, promptText: string) => {
    playZineBlip(910);
    try {
      await navigator.clipboard.writeText(promptText);
      setInlineCopiedSlot(slotId);
      window.setTimeout(() => setInlineCopiedSlot(null), 2000);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setVibeCustomized(false);
  }, [uiTheme?.id]);

  const isDarkStudio = Boolean(uiTheme?.isDark);
  const useThemeAccents = isDarkStudio && !vibeCustomized;

  const zTheme = {
    paperBg: isDarkStudio ? uiTheme!.middleBg : pal.paperBg,
    paperBgImage: isDarkStudio ? uiTheme!.middleBgImage : undefined,
    paperBgSize: isDarkStudio ? uiTheme!.middleBgSize : undefined,
    cardBg: isDarkStudio ? uiTheme!.surfaceBg : pal.cardBg,
    surfaceBg: isDarkStudio ? uiTheme!.surfaceBg : '#FFFFFF',
    surfaceElevated: isDarkStudio ? uiTheme!.surfaceElevated : '#FFFFFF',
    inputBg: isDarkStudio ? uiTheme!.inputBg : '#FFFFFF',
    mastheadBg: isDarkStudio ? uiTheme!.mastheadBg : pal.heroYellow,
    mastheadInk: isDarkStudio ? uiTheme!.ink : pal.ink,
    tile1: isDarkStudio ? uiTheme!.tile1 : pal.act1Tint,
    tile2: isDarkStudio ? uiTheme!.tile2 : pal.act2Tint,
    tile3: isDarkStudio ? uiTheme!.tile3 : pal.act3Tint,
    tile4: isDarkStudio ? uiTheme!.tile4 : '#FFFDF4',
    heroYellow: useThemeAccents ? uiTheme!.accent1 : pal.heroYellow,
    heroYellowInk: useThemeAccents ? uiTheme!.accent1Ink : '#121212',
    popPink: useThemeAccents ? uiTheme!.accent2 : pal.popPink,
    popPinkInk: useThemeAccents ? uiTheme!.accent2Ink : '#FFFFFF',
    popCyan: useThemeAccents ? uiTheme!.accent3 : pal.popCyan,
    popCyanInk: useThemeAccents ? uiTheme!.accent3Ink : '#121212',
    popLime: useThemeAccents ? uiTheme!.accent4 : pal.popLime,
    popLimeInk: useThemeAccents ? uiTheme!.accent4Ink : '#121212',
    ink: isDarkStudio ? uiTheme!.ink : pal.ink,
    mutedInk: isDarkStudio ? uiTheme!.mutedInk : '#525252',
    border: isDarkStudio ? uiTheme!.borderColor : '#121212',
    tickerBg: isDarkStudio ? uiTheme!.marqueeBg : pal.ink,
    tickerText: useThemeAccents ? uiTheme!.accent1 : pal.heroYellow,
    dotGridColor: isDarkStudio
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(18,18,18,0.09)',
  };

  const shots = issue.galleryUrls || [undefined, undefined, undefined, undefined];
  const presentShots = shots
    .map((url, slotIdx) => (url ? { url, slotIdx } : null))
    .filter((item): item is { url: string; slotIdx: number } => Boolean(item));

  // Hero Video, Auto Story Reel & Kaleidoscope Pop Canvas State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [reelIdx, setReelIdx] = useState(0);
  const [cinemaMode, setCinemaMode] = useState<'video' | 'popfx'>(
    issue.videoUrl ? 'video' : 'popfx'
  );

  useEffect(() => {
    setCinemaMode(issue.videoUrl ? 'video' : 'popfx');
    setReelIdx(0);
  }, [issue.id, issue.videoUrl]);

  useEffect(() => {
    if (issue.videoUrl || presentShots.length <= 1) return;
    const timer = window.setInterval(() => {
      setReelIdx((prev) => (prev + 1) % presentShots.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [issue.videoUrl, presentShots.length]);

  // Experimental Pop-Art Synth Canvas (when toggled or before Lead Video is uploaded)
  const popCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (cinemaMode !== 'popfx' && issue.videoUrl) return;
    const cvs = popCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;
    const shapes = Array.from({ length: 22 }, (_, idx) => ({
      x: (idx * 97) % 960,
      y: (idx * 73) % 540,
      vx: ((idx % 5) - 2) * 0.65 || 0.8,
      vy: ((idx % 3) - 1) * 0.55 || -0.6,
      size: 16 + (idx % 5) * 12,
      kind: idx % 3,
      colorIdx: idx % 4,
    }));

    const colors = [
      zTheme.heroYellow,
      zTheme.popPink,
      zTheme.popCyan,
      zTheme.popLime,
    ];

    const render = () => {
      t += 0.03;
      ctx.fillStyle = zTheme.paperBg;
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      ctx.strokeStyle = zTheme.dotGridColor;
      ctx.lineWidth = 1.5;
      for (let x = 0; x < cvs.width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cvs.height);
        ctx.stroke();
      }
      for (let y = 0; y < cvs.height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cvs.width, y);
        ctx.stroke();
      }

      shapes.forEach((s) => {
        s.x = (s.x + s.vx + cvs.width) % cvs.width;
        s.y = (s.y + s.vy + cvs.height) % cvs.height;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(t * 0.6 + s.size);
        ctx.fillStyle = zTheme.border;
        if (s.kind === 0) {
          ctx.beginPath();
          ctx.arc(4, 4, s.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-s.size / 2 + 4, -s.size / 2 + 4, s.size, s.size);
        }
        ctx.fillStyle = colors[s.colorIdx];
        ctx.strokeStyle = zTheme.border;
        ctx.lineWidth = 3;
        if (s.kind === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, s.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
          ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size);
        }
        ctx.restore();
      });

      colors.forEach((col, cIdx) => {
        ctx.beginPath();
        for (let x = 0; x <= cvs.width; x += 8) {
          const y =
            cvs.height / 2 +
            Math.sin(x * 0.012 + t * (1.4 + cIdx * 0.35) + cIdx) *
              (42 + cIdx * 14);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = zTheme.border;
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.strokeStyle = col;
        ctx.lineWidth = 5;
        ctx.stroke();
      });

      animId = window.requestAnimationFrame(render);
    };
    render();
    return () => window.cancelAnimationFrame(animId);
  }, [
    cinemaMode,
    issue.videoUrl,
    zTheme.paperBg,
    zTheme.dotGridColor,
    zTheme.border,
    zTheme.heroYellow,
    zTheme.popPink,
    zTheme.popCyan,
    zTheme.popLime,
  ]);

  // Master Soundtrack Audio & 28-Bar WebAudio Spectrum Visualizer
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const userPausedRef = useRef<boolean>(false);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.85);
  const [synthFallbackPlaying, setSynthFallbackPlaying] = useState(false);

  const connectAnalyserIfReady = async (el: HTMLAudioElement) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      if (
        audioCtxRef.current.state === 'running' &&
        connectedElementRef.current !== el
      ) {
        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 128;
        const src = audioCtxRef.current.createMediaElementSource(el);
        src.connect(analyser);
        analyser.connect(audioCtxRef.current.destination);
        analyserRef.current = analyser;
        connectedElementRef.current = el;
      }
    } catch {
      // Fallback to animated spectrum without WebAudio tap
    }
  };

  // Automatically play audio whenever a Zine with audio opens or a song is dropped in
  useEffect(() => {
    userPausedRef.current = false;
    setAudioTime(0);
    setAudioDuration(0);

    if (!issue.audioUrl) {
      setAudioPlaying(false);
      return;
    }

    let cancelled = false;
    const tryAutoPlay = async () => {
      const el = audioRef.current;
      if (!el || cancelled || userPausedRef.current) return;
      el.volume = audioVolume;
      el.loop = true;
      try {
        await el.play();
        if (!cancelled) {
          setAudioPlaying(true);
          void connectAnalyserIfReady(el);
        }
      } catch {
        // Browser blocked unmuted cold autoplay before first gesture — resume on very first tap/click/key
        setAudioPlaying(false);
      }
    };

    const timer = window.setTimeout(() => {
      void tryAutoPlay();
    }, 60);

    const unlockOnFirstGesture = () => {
      const el = audioRef.current;
      if (!el || cancelled || userPausedRef.current || !el.paused) return;
      el.volume = audioVolume;
      el.loop = true;
      el.play()
        .then(() => {
          if (!cancelled) {
            setAudioPlaying(true);
            void connectAnalyserIfReady(el);
          }
        })
        .catch(() => {});
    };

    window.addEventListener('pointerdown', unlockOnFirstGesture, { once: true });
    window.addEventListener('keydown', unlockOnFirstGesture, { once: true });
    window.addEventListener('touchstart', unlockOnFirstGesture, { once: true });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', unlockOnFirstGesture);
      window.removeEventListener('keydown', unlockOnFirstGesture);
      window.removeEventListener('touchstart', unlockOnFirstGesture);
    };
  }, [issue.id, issue.audioUrl]);

  useEffect(() => {
    const cvs = spectrumCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let idleTick = 0;
    const freqData = new Uint8Array(64);
    const barColors = [
      zTheme.popPink,
      zTheme.heroYellow,
      zTheme.popCyan,
      zTheme.popLime,
    ];

    const drawSpectrum = () => {
      idleTick += 0.08;
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const bars = 28;
      const gap = 3.5;
      const barW = (cvs.width - gap * (bars - 1)) / bars;

      if (analyserRef.current && audioPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
      }

      for (let i = 0; i < bars; i++) {
        let ratio = 0.18;
        if (analyserRef.current && audioPlaying) {
          ratio = Math.max(0.14, freqData[i] / 255);
        } else if (audioPlaying || synthFallbackPlaying) {
          ratio =
            0.25 +
            0.65 *
              Math.abs(
                Math.sin(idleTick * 1.9 + i * 0.42) *
                  Math.cos(idleTick * 0.8 + i * 0.2)
              );
        } else {
          ratio = 0.14 + 0.07 * Math.sin(idleTick + i * 0.35);
        }

        const h = Math.max(6, ratio * (cvs.height - 4));
        const x = i * (barW + gap);
        const y = cvs.height - h;

        ctx.fillStyle = barColors[i % barColors.length];
        ctx.fillRect(x, y, barW, h);
        ctx.strokeStyle = zTheme.border;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x, y, barW, h);
      }

      animId = window.requestAnimationFrame(drawSpectrum);
    };

    drawSpectrum();
    return () => window.cancelAnimationFrame(animId);
  }, [
    audioPlaying,
    synthFallbackPlaying,
    zTheme.border,
    zTheme.heroYellow,
    zTheme.popPink,
    zTheme.popCyan,
    zTheme.popLime,
  ]);

  const handleToggleAudio = async () => {
    playZineBlip(860);
    if (issue.audioUrl && audioRef.current) {
      if (audioPlaying) {
        userPausedRef.current = true;
        audioRef.current.pause();
        setAudioPlaying(false);
      } else {
        userPausedRef.current = false;
        audioRef.current.volume = audioVolume;
        audioRef.current.loop = true;
        audioRef.current
          .play()
          .then(() => {
            setAudioPlaying(true);
            if (audioRef.current) void connectAnalyserIfReady(audioRef.current);
          })
          .catch(() => {
            playProcedural199xSongPreview(issue.issueNumber);
            setSynthFallbackPlaying(true);
            window.setTimeout(() => setSynthFallbackPlaying(false), 4200);
          });
      }
    } else {
      playProcedural199xSongPreview(issue.issueNumber);
      setSynthFallbackPlaying(true);
      window.setTimeout(() => setSynthFallbackPlaying(false), 4200);
    }
  };

  // Interactive Pluckable Synth Resonance Wave Toy in Spread 03
  const waveToyRef = useRef<HTMLCanvasElement | null>(null);
  const [waveAmpBoost, setWaveAmpBoost] = useState(0);
  useEffect(() => {
    const cvs = waveToyRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let ph = 0;
    const drawWave = () => {
      ph += 0.09;
      ctx.fillStyle = zTheme.inputBg;
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      const amp = 14 + waveAmpBoost * 20;
      const layers = [
        { color: zTheme.popCyan, offset: 0 },
        { color: zTheme.popPink, offset: 1.4 },
        { color: zTheme.heroYellow, offset: 2.8 },
      ];

      layers.forEach((l) => {
        ctx.beginPath();
        for (let x = 0; x <= cvs.width; x += 4) {
          const y =
            cvs.height / 2 +
            Math.sin(x * 0.035 + ph + l.offset) *
              amp *
              Math.sin(x * 0.01 + ph * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = zTheme.border;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      animId = window.requestAnimationFrame(drawWave);
    };
    drawWave();
    return () => window.cancelAnimationFrame(animId);
  }, [
    waveAmpBoost,
    zTheme.inputBg,
    zTheme.border,
    zTheme.popCyan,
    zTheme.popPink,
    zTheme.heroYellow,
  ]);

  const handlePluckWave = () => {
    playZineResonanceChime();
    setWaveAmpBoost(1);
    window.setTimeout(() => setWaveAmpBoost(0.45), 350);
    window.setTimeout(() => setWaveAmpBoost(0), 900);
  };

  // Fullscreen 2K Lightbox Modal State (indexes into presentShots)
  const [lightboxPos, setLightboxPos] = useState<number | null>(null);
  useEffect(() => {
    if (lightboxPos === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxPos(null);
      if (e.key === 'ArrowRight' && presentShots.length > 0) {
        setLightboxPos((prev) =>
          prev === null ? 0 : (prev + 1) % presentShots.length
        );
      }
      if (e.key === 'ArrowLeft' && presentShots.length > 0) {
        setLightboxPos((prev) =>
          prev === null
            ? 0
            : (prev - 1 + presentShots.length) % presentShots.length
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxPos, presentShots.length]);

  const openShotInLightbox = (slotIdx: number) => {
    const pos = presentShots.findIndex((p) => p.slotIdx === slotIdx);
    if (pos >= 0) {
      playZineBlip(940);
      setLightboxPos(pos);
    }
  };

  // Export Standalone HTML Zine State
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const handleDownloadStandaloneHtml = async () => {
    if (isExportingHtml) return;
    playZineResonanceChime();
    setIsExportingHtml(true);
    setExportMsg('Saving & Packing Zine...');
    try {
      if (onSaveToShelf) {
        await onSaveToShelf();
      }
      await exportStandaloneZineHtml(
        issue,
        (status) => setExportMsg(status),
        uiTheme
      );
      setExportMsg('✓ Saved to Shelf & Downloaded .HTML!');
      window.setTimeout(() => setExportMsg(null), 3200);
    } finally {
      setIsExportingHtml(false);
    }
  };

  const isVideoLoopUrl = (url?: string) =>
    !!url &&
    (url.includes('#video') ||
      url.startsWith('data:video/') ||
      url.toLowerCase().endsWith('.mp4') ||
      url.toLowerCase().endsWith('.webm'));

  const renderStoryGifCard = (
    slotKey: 'gif1' | 'gif2',
    promptText: string,
    loopUrl: string | undefined,
    _fallbackStill: string | undefined,
    badgeLabel: string,
    badgeBg: string,
    badgeInk: string,
    captionLabel: string,
    tiltClass: string
  ) => {
    if (readerMode && !loopUrl) return null;
    const isVid = isVideoLoopUrl(loopUrl);
    const isHover = dragHoverSlot === slotKey;
    return (
      <div
        onDragOver={(e) => {
          if (readerMode || !onDropSlotFile) return;
          e.preventDefault();
          setDragHoverSlot(slotKey);
        }}
        onDragLeave={() => setDragHoverSlot(null)}
        onDrop={(e) => {
          if (readerMode || !onDropSlotFile) return;
          e.preventDefault();
          setDragHoverSlot(null);
          const f = e.dataTransfer.files?.[0];
          if (f) onDropSlotFile(slotKey, f);
        }}
        className={`relative pop-card p-3.5 sm:p-4 flex flex-col justify-between ${tiltClass} hover:rotate-0 transition-transform duration-300`}
        style={{
          backgroundColor: isHover ? zTheme.tile2 : zTheme.surfaceBg,
        }}
      >
        <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 rounded-sm -rotate-2 z-20 pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
          <span
            className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
            style={{ backgroundColor: badgeBg, color: badgeInk }}
          >
            {badgeLabel}
          </span>

          {!readerMode ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyInlinePrompt(slotKey, promptText)}
                style={{
                  backgroundColor:
                    inlineCopiedSlot === slotKey
                      ? '#10B981'
                      : zTheme.surfaceElevated,
                  color: inlineCopiedSlot === slotKey ? '#04130D' : zTheme.ink,
                }}
                className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                title="Copy story-matched GIF prompt"
              >
                {inlineCopiedSlot === slotKey ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Prompt
                  </>
                )}
              </button>
              {onClickUploadSlot && (
                <button
                  type="button"
                  onClick={() => onClickUploadSlot(slotKey)}
                  style={{
                    backgroundColor: zTheme.heroYellow,
                    color: zTheme.heroYellowInk,
                  }}
                  className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" /> {loopUrl ? 'Swap' : 'Add GIF'}
                </button>
              )}
            </div>
          ) : (
            <span className="font-mono-zine text-[11px] font-bold">
              {loopUrl ? '★ LIVE GIF LOOP' : '16:9 LOOP'}
            </span>
          )}
        </div>

        <div
          onClick={() => !loopUrl && !readerMode && onClickUploadSlot?.(slotKey)}
          className={`relative w-full rounded-2xl border-[3px] theme-border bg-[#121212] overflow-hidden flex items-center justify-center min-h-[260px] ${
            !loopUrl && !readerMode ? 'cursor-pointer' : ''
          }`}
        >
          {loopUrl ? (
            isVid ? (
              <video
                src={loopUrl.split('#')[0]}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto max-h-[640px] object-contain block"
              />
            ) : (
              <img
                src={loopUrl}
                alt={badgeLabel}
                className="w-full h-auto max-h-[640px] object-contain block"
              />
            )
          ) : (
            <div className="w-full py-10 flex flex-col items-center justify-center font-mono-zine text-xs text-zinc-300 p-4 text-center gap-1.5">
              <Film className="w-6 h-6 text-pink-400" />
              <span className="font-bold text-white">Drop Story GIF / Loop (.gif or .mp4) here!</span>
              <span className="text-[11px] text-zinc-400">
                Or copy the Step 2 GIF prompt above (stays hidden in export until added — zero duplicate images!)
              </span>
            </div>
          )}

          <div
            className="pointer-events-none absolute bottom-3 right-3 px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-[10px] font-bold uppercase -rotate-2"
            style={{
              backgroundColor: zTheme.popLime,
              color: zTheme.popLimeInk,
              boxShadow: '2px 2px 0 var(--ui-border)',
            }}
          >
            {captionLabel}
          </div>
        </div>
      </div>
    );
  };

  const shotPromptByIdx = [
    issue.prompts.shot01WideArchitecture,
    issue.prompts.shot02AnomalyPortrait,
    issue.prompts.shot03LowAngleAction,
    issue.prompts.shot04TabletopGearFlatlay,
  ];

  const renderShotPolaroid = (
    slotIdx: 0 | 1 | 2 | 3,
    badgeBg: string,
    badgeInk: string,
    tiltClass: string,
    compact: boolean = false
  ) => {
    const src = shots[slotIdx];
    const meta = SHOT_STICKERS[slotIdx];
    const slotKey = `shot${slotIdx}` as ZineMediaSlotKey;
    const promptText = shotPromptByIdx[slotIdx];
    const isHover = dragHoverSlot === slotKey;

    return (
      <div
        onDragOver={(e) => {
          if (readerMode || !onDropSlotFile) return;
          e.preventDefault();
          setDragHoverSlot(slotKey);
        }}
        onDragLeave={() => setDragHoverSlot(null)}
        onDrop={(e) => {
          if (readerMode || !onDropSlotFile) return;
          e.preventDefault();
          setDragHoverSlot(null);
          const f = e.dataTransfer.files?.[0];
          if (f) onDropSlotFile(slotKey, f);
        }}
        style={{ backgroundColor: isHover ? zTheme.tile1 : zTheme.surfaceBg }}
        className={`relative pop-card w-full ${src ? 'pop-card-lift' : ''} p-2.5 sm:p-3 ${tiltClass} hover:rotate-0 transition-transform`}
      >
        {compact && (
          <div className="washi-tape absolute -top-3 left-8 w-24 h-5 rounded-sm -rotate-2 z-20 pointer-events-none" />
        )}
        <div
          onClick={() => {
            if (src) openShotInLightbox(slotIdx);
            else if (!readerMode) onClickUploadSlot?.(slotKey);
          }}
          className="aspect-[16/10] w-full rounded-xl border-[2.5px] theme-border overflow-hidden bg-[#121212] flex items-center justify-center cursor-pointer"
        >
          {src ? (
            <img
              src={src}
              alt={meta.badge}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="text-center p-4 font-mono-zine text-xs text-zinc-400 space-y-1">
              <ImageIcon className="w-6 h-6 mx-auto text-cyan-400 opacity-80" />
              <div className="font-bold text-zinc-100">{meta.badge}</div>
              <div className="text-[11px]">{meta.note} — Drop or click to add image</div>
            </div>
          )}
        </div>
        <div className="pt-3 px-1 flex flex-wrap items-center justify-between gap-2">
          <span
            className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-[11px] sm:text-xs font-bold uppercase"
            style={{ backgroundColor: badgeBg, color: badgeInk }}
          >
            {meta.badge}
          </span>

          <div className="flex items-center gap-1.5">
            {!readerMode && (
              <>
                <button
                  type="button"
                  onClick={() => copyInlinePrompt(slotKey, promptText)}
                  style={{
                    backgroundColor:
                      inlineCopiedSlot === slotKey
                        ? '#10B981'
                        : zTheme.surfaceElevated,
                    color: inlineCopiedSlot === slotKey ? '#04130D' : zTheme.ink,
                  }}
                  className="px-2 py-0.5 rounded-lg border-2 theme-border font-mono-zine text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                >
                  {inlineCopiedSlot === slotKey ? (
                    <>
                      <Check className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Prompt
                    </>
                  )}
                </button>
                {onClickUploadSlot && (
                  <button
                    type="button"
                    onClick={() => onClickUploadSlot(slotKey)}
                    style={{
                      backgroundColor: zTheme.surfaceElevated,
                      color: zTheme.ink,
                    }}
                    className="px-2 py-0.5 rounded-lg border-2 theme-border font-mono-zine text-[10px] font-bold uppercase cursor-pointer"
                  >
                    {src ? 'Swap' : '+ Img'}
                  </button>
                )}
              </>
            )}
            {src && (
              <button
                type="button"
                onClick={() => openShotInLightbox(slotIdx)}
                className="font-mono-zine text-xs font-bold underline cursor-pointer"
              >
                2K ⤢
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const resolvedCardImage =
    issue.cardImageUrl || shots[1] || shots[2] || shots[0];
  const resolvedCardVideo = issue.cardVideoUrl || issue.videoUrl;

  return (
    <div
      className="relative pop-card overflow-hidden transition-colors duration-300 font-zine-sans"
      style={{
        backgroundColor: zTheme.paperBg,
        backgroundImage: zTheme.paperBgImage,
        backgroundSize: zTheme.paperBgSize,
        color: zTheme.ink,
      }}
    >
      {/* Hidden Audio Element (Autoplays & Loops with Story) */}
      {issue.audioUrl && (
        <audio
          ref={audioRef}
          src={issue.audioUrl}
          autoPlay
          loop
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onLoadedMetadata={(e) =>
            setAudioDuration(e.currentTarget.duration || 0)
          }
          onTimeUpdate={(e) => setAudioTime(e.currentTarget.currentTime || 0)}
          onEnded={() => setAudioPlaying(false)}
        />
      )}

      {/* ==================== 1. CANDY PALETTE REMIXER & HTML EXPORT BAR ==================== */}
      <div
        className="px-4 sm:px-7 py-3.5 border-b-[3px] theme-border flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: zTheme.cardBg }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span
            style={{
              backgroundColor: zTheme.tickerBg,
              color: zTheme.heroYellow,
            }}
            className="font-mono-zine text-xs font-bold uppercase px-2.5 py-1 rounded-full"
          >
            🎨 Zine Vibe:
          </span>
          {ZINE_PALETTES.map((zp) => {
            const active = zp.finishId === issue.zinePaletteId;
            return (
              <button
                key={zp.finishId}
                type="button"
                onClick={() => {
                  playZineBlip(820);
                  setVibeCustomized(true);
                  onUpdatePalette?.(zp.finishId);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold border-2 theme-border transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? '-translate-y-0.5 scale-105'
                    : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5'
                }`}
                style={{
                  backgroundColor: active ? zp.heroYellow : zp.paperBg,
                  color: zp.ink,
                  boxShadow: active ? '3px 3px 0 var(--ui-border)' : undefined,
                }}
              >
                <span>{zp.emoji}</span>
                <span className="hidden sm:inline">{zp.name}</span>
              </button>
            );
          })}
        </div>

        {!readerMode && (
          <div className="flex flex-wrap items-center gap-2">
            {onSaveToShelf && (
              <button
                type="button"
                onClick={() => void onSaveToShelf()}
                disabled={isSavingShelf}
                className="pop-btn px-4 py-2 font-display font-extrabold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: zTheme.popPink,
                  color: zTheme.popPinkInk,
                }}
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                {isSavingShelf
                  ? 'Saving...'
                  : isSavedOnShelf
                  ? '✓ Update on Zine Shelf'
                  : 'Save to Zine Shelf'}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              disabled={isExportingHtml}
              className="pop-btn px-4 py-2 font-display font-extrabold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2 cursor-pointer"
              style={{
                backgroundColor: zTheme.popLime,
                color: zTheme.popLimeInk,
              }}
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              {exportMsg || 'Download .HTML Zine'}
            </button>
          </div>
        )}
      </div>

      {/* ==================== MAIN ZINE PLAYGROUND CANVAS ==================== */}
      <div className="p-3 sm:p-6 lg:p-7 space-y-8 sm:space-y-10 halftone-dots">
        {/* ==================== 2. TOP HERO LEAD (FULL 12-COLUMN WIDTH): 16:9 1080P CINEMA + DOCKED BOOMBOX ==================== */}
        <section className="space-y-5">
          <div
            onDragOver={(e) => {
              if (readerMode || !onDropSlotFile) return;
              e.preventDefault();
              setDragHoverSlot('video');
            }}
            onDragLeave={() => setDragHoverSlot(null)}
            onDrop={(e) => {
              if (readerMode || !onDropSlotFile) return;
              e.preventDefault();
              setDragHoverSlot(null);
              const f = e.dataTransfer.files?.[0];
              if (f) onDropSlotFile('video', f);
            }}
            style={{
              backgroundColor:
                dragHoverSlot === 'video' ? zTheme.tile3 : zTheme.surfaceBg,
            }}
            className="pop-card overflow-hidden"
          >
            <div
              className="px-4 py-2.5 border-b-[3px] theme-border flex flex-wrap items-center justify-between gap-2"
              style={{
                backgroundColor: zTheme.popCyan,
                color: zTheme.popCyanInk,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF2A85] border-2 border-[#121212]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFE600] border-2 border-[#121212]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#B8FF00] border-2 border-[#121212]" />
                <span className="font-mono-zine text-xs font-bold uppercase ml-1">
                  🎬 STORY LEAD VIDEO // 1080P HERO CINEMA (16:9)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!readerMode && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        copyInlinePrompt('video', issue.prompts.leadVideo16x9)
                      }
                      style={{
                        backgroundColor:
                          inlineCopiedSlot === 'video'
                            ? '#10B981'
                            : zTheme.surfaceElevated,
                        color:
                          inlineCopiedSlot === 'video' ? '#04130D' : zTheme.ink,
                      }}
                      className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      {inlineCopiedSlot === 'video' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Video Prompt
                        </>
                      )}
                    </button>

                    {onClickUploadSlot && (
                      <button
                        type="button"
                        onClick={() => onClickUploadSlot('video')}
                        style={{
                          backgroundColor: zTheme.heroYellow,
                          color: zTheme.heroYellowInk,
                        }}
                        className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />{' '}
                        {issue.videoUrl ? 'Swap Video' : 'Add Video'}
                      </button>
                    )}
                  </>
                )}

                {issue.videoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      playZineBlip(790);
                      setCinemaMode((m) => (m === 'video' ? 'popfx' : 'video'));
                    }}
                    style={{
                      backgroundColor: zTheme.surfaceElevated,
                      color: zTheme.ink,
                    }}
                    className="px-2.5 py-1 rounded-lg border-2 theme-border hover:brightness-110 font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    {cinemaMode === 'video' ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Pop FX
                      </>
                    ) : (
                      <>
                        <Film className="w-3.5 h-3.5" /> Video
                      </>
                    )}
                  </button>
                )}

                {issue.videoUrl && cinemaMode === 'video' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !videoMuted;
                        setVideoMuted(!videoMuted);
                      }
                    }}
                    style={{
                      backgroundColor: zTheme.surfaceElevated,
                      color: zTheme.ink,
                    }}
                    className="px-2.5 py-1 rounded-lg border-2 theme-border hover:brightness-110 font-mono-zine text-[11px] font-bold uppercase cursor-pointer"
                  >
                    {videoMuted ? '🔇 Unmute' : '🔊 Live'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const el = videoRef.current || popCanvasRef.current;
                    if (el?.requestFullscreen) el.requestFullscreen();
                  }}
                  style={{
                    backgroundColor: zTheme.surfaceElevated,
                    color: zTheme.ink,
                  }}
                  className="p-1 rounded-lg border-2 theme-border hover:brightness-110 cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              onClick={() =>
                !issue.videoUrl && !readerMode && onClickUploadSlot?.('video')
              }
              className={`relative aspect-video w-full bg-[#121212] overflow-hidden ${
                !issue.videoUrl && !readerMode ? 'cursor-pointer' : ''
              }`}
            >
              {issue.videoUrl && cinemaMode === 'video' ? (
                <video
                  ref={videoRef}
                  src={issue.videoUrl}
                  poster={shots[0] || shots[1]}
                  autoPlay
                  loop
                  muted={videoMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : presentShots.length > 0 ? (
                <div className="relative w-full h-full overflow-hidden bg-[#121212]">
                  {presentShots.map((item, idx) => (
                    <img
                      key={item.slotIdx}
                      src={item.url}
                      alt={SHOT_STICKERS[item.slotIdx]?.badge || 'Story Reel Frame'}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        idx === reelIdx % presentShots.length
                          ? 'opacity-100 zine-motion-tension'
                          : 'opacity-0'
                      }`}
                    />
                  ))}
                  <div className="pointer-events-none absolute inset-0 zine-neon-flicker-overlay" />
                </div>
              ) : (
                <canvas
                  ref={popCanvasRef}
                  width={960}
                  height={540}
                  className="w-full h-full object-cover"
                />
              )}

              <div
                className="pointer-events-none absolute top-3 left-3 px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-[11px] font-bold uppercase"
                style={{
                  backgroundColor: zTheme.popPink,
                  color: zTheme.popPinkInk,
                  boxShadow: '2px 2px 0 var(--ui-border)',
                }}
              >
                {issue.videoUrl
                  ? `★ ISSUE #${String(issue.issueNumber).padStart(2, '0')} LEAD VIDEO`
                  : presentShots.length > 0
                  ? `▶ AUTO STORY REEL (${(reelIdx % presentShots.length) + 1}/${presentShots.length})`
                  : `★ ISSUE #${String(issue.issueNumber).padStart(2, '0')} HERO CINEMA`}
              </div>

              <div
                className="pointer-events-none absolute bottom-3 left-3 px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-[11px] font-bold uppercase"
                style={{
                  backgroundColor: zTheme.heroYellow,
                  color: zTheme.heroYellowInk,
                  boxShadow: '2px 2px 0 var(--ui-border)',
                }}
              >
                {issue.videoUrl
                  ? issue.cameraAngle
                  : presentShots.length > 0
                  ? `${SHOT_STICKERS[presentShots[reelIdx % presentShots.length].slotIdx]?.badge || 'STORY MOTION'} • (OPTIONAL: DROP .MP4 TO UPGRADE)`
                  : 'DROP 1 STORYBOARD SHEET ABOVE OR .MP4 HERE'}
              </div>
            </div>
          </div>

          {/* Docked Spinning Vinyl Story Soundtrack Boombox + 28-Bar WebAudio Spectrum Canvas */}
          <div
            onDragOver={(e) => {
              if (readerMode || !onDropSlotFile) return;
              e.preventDefault();
              setDragHoverSlot('audio');
            }}
            onDragLeave={() => setDragHoverSlot(null)}
            onDrop={(e) => {
              if (readerMode || !onDropSlotFile) return;
              e.preventDefault();
              setDragHoverSlot(null);
              const f = e.dataTransfer.files?.[0];
              if (f) onDropSlotFile('audio', f);
            }}
            className="pop-card p-4 sm:p-5 flex flex-col lg:flex-row items-center gap-4"
            style={{
              backgroundColor:
                dragHoverSlot === 'audio' ? zTheme.tile1 : zTheme.tile2,
              color: zTheme.ink,
            }}
          >
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleToggleAudio}
                className="pop-btn px-5 py-3 font-display font-extrabold text-sm uppercase flex items-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: audioPlaying
                    ? zTheme.popLime
                    : zTheme.popPink,
                  color: audioPlaying ? zTheme.popLimeInk : zTheme.popPinkInk,
                }}
              >
                {audioPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pause Audio
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Play Story Audio
                  </>
                )}
              </button>

              <div
                className={`w-11 h-11 rounded-full border-[3px] theme-border bg-[#121212] flex items-center justify-center shrink-0 ${
                  audioPlaying || synthFallbackPlaying
                    ? 'animate-vinyl-spin'
                    : ''
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center"
                  style={{
                    backgroundColor: zTheme.heroYellow,
                    color: zTheme.heroYellowInk,
                  }}
                >
                  <Disc3 className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="flex-1 w-full min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="truncate">
                  🎵 {issue.audioTitle || '199X 3-Act Story Soundtrack'}
                </span>
                <span className="font-mono-zine text-[11px] shrink-0">
                  {issue.audioUrl
                    ? `${formatSeconds(audioTime)} / ${formatSeconds(
                        audioDuration
                      )}`
                    : 'FOLLOWS ACT I → II → III'}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={audioDuration || 100}
                step={0.1}
                value={audioTime}
                disabled={!issue.audioUrl}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setAudioTime(next);
                  if (audioRef.current) audioRef.current.currentTime = next;
                }}
                style={{
                  accentColor: zTheme.popPink,
                  backgroundColor: zTheme.inputBg,
                }}
                className="w-full h-2.5 rounded-full border-2 theme-border cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {!readerMode && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      copyInlinePrompt('audio', issue.prompts.synthSongPrompt)
                    }
                    style={{
                      backgroundColor:
                        inlineCopiedSlot === 'audio'
                          ? '#10B981'
                          : zTheme.surfaceElevated,
                      color:
                        inlineCopiedSlot === 'audio' ? '#04130D' : zTheme.ink,
                    }}
                    className="px-2.5 py-1.5 rounded-xl border-2 theme-border font-mono-zine text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    {inlineCopiedSlot === 'audio' ? (
                      <>
                        <Check className="w-3 h-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Audio Prompt
                      </>
                    )}
                  </button>
                  {onClickUploadSlot && (
                    <button
                      type="button"
                      onClick={() => onClickUploadSlot('audio')}
                      style={{
                        backgroundColor: zTheme.surfaceElevated,
                        color: zTheme.ink,
                      }}
                      className="px-2.5 py-1.5 rounded-xl border-2 theme-border font-mono-zine text-[10px] font-bold uppercase cursor-pointer"
                    >
                      {issue.audioUrl ? 'Swap MP3' : '+ Add MP3'}
                    </button>
                  )}
                </>
              )}

              <canvas
                ref={spectrumCanvasRef}
                width={156}
                height={42}
                style={{ backgroundColor: zTheme.inputBg }}
                className="w-[140px] sm:w-[156px] h-[42px] rounded-xl border-2 theme-border p-1"
              />
              <button
                type="button"
                onClick={() => {
                  const nextVol = audioVolume > 0 ? 0 : 0.85;
                  setAudioVolume(nextVol);
                  if (audioRef.current) audioRef.current.volume = nextVol;
                }}
                style={{
                  backgroundColor: zTheme.surfaceElevated,
                  color: zTheme.ink,
                }}
                className="p-2 rounded-xl border-2 theme-border hover:brightness-110 cursor-pointer"
                title="Mute / Unmute Music"
              >
                {audioVolume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ==================== 3. COVER MASTHEAD & LOCATION/GEAR/ANOMALY PILLS ==================== */}
        <header
          className="relative pop-card p-5 sm:p-8 overflow-hidden"
          style={{ backgroundColor: zTheme.mastheadBg }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 w-52 h-52 rounded-full border-[3px] theme-border opacity-85"
            style={{ backgroundColor: zTheme.popPink }}
          />
          <div
            className="pointer-events-none absolute right-24 -bottom-10 w-28 h-28 rounded-full border-[3px] theme-border opacity-90"
            style={{ backgroundColor: zTheme.popCyan }}
          />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="px-3.5 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase -rotate-2"
                style={{
                  backgroundColor: zTheme.popPink,
                  color: zTheme.popPinkInk,
                  boxShadow: '3px 3px 0 var(--ui-border)',
                }}
              >
                ★ ZINE ISSUE #{String(issue.issueNumber).padStart(2, '0')} //{' '}
                {issue.classification}
              </span>

              <span
                style={{
                  backgroundColor: zTheme.surfaceElevated,
                  color: zTheme.ink,
                }}
                className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase rotate-1"
              >
                📍 {issue.sectorTag}
              </span>

              <span
                className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase -rotate-1"
                style={{
                  backgroundColor: zTheme.popCyan,
                  color: zTheme.popCyanInk,
                }}
              >
                HERO: {issue.characterName}
              </span>

              {!readerMode && onAiRewriteStory && (
                <button
                  type="button"
                  onClick={() => void onAiRewriteStory()}
                  disabled={isAiRewriting}
                  style={{
                    backgroundColor: zTheme.surfaceElevated,
                    color: zTheme.ink,
                  }}
                  className="ml-auto px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer hover:brightness-110"
                  title="Optional: have Gemini 3 rewrite this 3-Act story"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiRewriting ? 'Rewriting Story...' : 'AI Rewrite Story'}</span>
                </button>
              )}
            </div>

            <h1
              style={{
                color: zTheme.mastheadInk,
                textShadow: isDarkStudio
                  ? `3px 3px 0px ${zTheme.border}`
                  : '3px 3px 0px #FFFFFF',
              }}
              className="font-display text-3xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.94] max-w-4xl break-words"
            >
              {issue.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                style={{
                  backgroundColor: zTheme.surfaceElevated,
                  color: zTheme.ink,
                  boxShadow: '2px 2px 0 var(--ui-border)',
                }}
                className="px-3 py-1.5 rounded-xl border-2 theme-border text-xs font-bold"
              >
                📍 <strong>Setting:</strong> {issue.location}
              </span>
              <span
                className="px-3 py-1.5 rounded-xl border-2 theme-border text-xs font-bold"
                style={{
                  backgroundColor: zTheme.popLime,
                  color: zTheme.popLimeInk,
                  boxShadow: '2px 2px 0 var(--ui-border)',
                }}
              >
                🎒 <strong>Gear:</strong> {issue.artifact} + {issue.weapon}
              </span>
              <span
                style={{
                  backgroundColor: zTheme.surfaceElevated,
                  color: zTheme.ink,
                  boxShadow: '2px 2px 0 var(--ui-border)',
                }}
                className="px-3 py-1.5 rounded-xl border-2 theme-border text-xs font-bold"
              >
                👾 <strong>Anomaly:</strong> {issue.anomalyName}
              </span>
            </div>
          </div>
        </header>

        {/* ==================== 4. INFINITE SCROLLING MARQUEE TICKER ==================== */}
        <div
          className="pop-card py-2.5 overflow-hidden border-[3px] theme-border"
          style={{
            backgroundColor: zTheme.tickerBg,
            color: zTheme.tickerText,
          }}
        >
          <div className="animate-zine-marquee font-mono-zine text-xs sm:text-sm font-bold uppercase tracking-widest">
            <span className="mx-6">
              ★ 3-ACT ILLUSTRATED ZINE ★ 1 HERO VIDEO ★ 2 STORY GIFS ★ 4
              STORY-SYNCED IMAGES ★ SOUNDTRACK AUDIO ★ SYNERGY: {issue.synergy} ★
            </span>
            <span className="mx-6">
              ★ 3-ACT ILLUSTRATED ZINE ★ 1 HERO VIDEO ★ 2 STORY GIFS ★ 4
              STORY-SYNCED IMAGES ★ SOUNDTRACK AUDIO ★ SYNERGY: {issue.synergy} ★
            </span>
          </div>
        </div>

        {/* ==================== 5. 3-ACT STORY SPREADS + 2 STORY GIFS + 4 IMAGES FOLLOWING THE STORY ==================== */}
        <div className="space-y-12">
          {/* ---------- SPREAD 01: ACT 01 PROSE (LEFT) + GIF 01 & IMAGE 01 (RIGHT) ---------- */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <article
              className="lg:col-span-5 pop-card p-6 sm:p-7 relative overflow-hidden"
              style={{ backgroundColor: zTheme.tile1, color: zTheme.ink }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
                  style={{
                    backgroundColor: zTheme.heroYellow,
                    color: zTheme.heroYellowInk,
                    boxShadow: '2px 2px 0 var(--ui-border)',
                  }}
                >
                  ACT 01 // THE SETUP
                </span>
                <span className="font-display text-5xl font-extrabold opacity-20 select-none">
                  01
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase leading-tight mb-4">
                Entering {issue.location}
              </h2>
              <p className="text-base sm:text-[17px] leading-[1.75] font-medium opacity-95 whitespace-pre-line">
                {issue.acts.sceneSetup}
              </p>
            </article>

            <div className="lg:col-span-7 space-y-6">
              {renderShotPolaroid(
                0,
                zTheme.popCyan,
                zTheme.popCyanInk,
                'lg:-rotate-[0.7deg]'
              )}

              {renderStoryGifCard(
                'gif1',
                issue.prompts.sameChatGif1FollowupPrompt,
                issue.gifUrl,
                undefined,
                '🎞️ GIF 01 // ACT I TENSION LOOP',
                zTheme.popPink,
                zTheme.popPinkInk,
                'FOLLOWS ACT 01 ∞',
                'lg:rotate-[0.9deg]'
              )}
            </div>
          </section>

          {/* ---------- SPREAD 02 (REVERSED): IMAGE 02 + TILTED IMAGE 03 (LEFT) × ACT 02 PROSE & GEAR NOTES (RIGHT) ---------- */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
              {renderShotPolaroid(
                1,
                zTheme.popPink,
                zTheme.popPinkInk,
                'lg:-rotate-[1deg]'
              )}

              {renderShotPolaroid(
                2,
                zTheme.heroYellow,
                zTheme.heroYellowInk,
                'lg:rotate-[1.2deg]',
                true
              )}
            </div>

            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
              <article
                className="pop-card p-6 sm:p-8"
                style={{ backgroundColor: zTheme.tile2, color: zTheme.ink }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
                    style={{
                      backgroundColor: zTheme.popPink,
                      color: zTheme.popPinkInk,
                      boxShadow: '2px 2px 0 var(--ui-border)',
                    }}
                  >
                    ACT 02 // KINETIC CLASH
                  </span>
                  <span className="font-display text-5xl font-extrabold opacity-20 select-none">
                    02
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase leading-tight mb-4">
                  {issue.synergy}
                </h2>
                <p className="text-base sm:text-[17px] leading-[1.75] font-medium opacity-95 whitespace-pre-line">
                  {issue.acts.intervention}
                </p>
              </article>

              <div
                style={{ backgroundColor: zTheme.surfaceBg }}
                className="pop-card p-5 space-y-3"
              >
                <div className="font-display text-lg font-extrabold uppercase flex items-center gap-2">
                  <span>🎒</span> Story Loadout &amp; Field Notes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div
                    className="p-3 rounded-xl border-2 theme-border"
                    style={{ backgroundColor: zTheme.tile1 }}
                  >
                    <div className="font-mono-zine text-[10px] font-bold uppercase opacity-70">
                      NOSTALGIA ARTIFACT
                    </div>
                    <div className="font-bold mt-0.5">{issue.artifact}</div>
                  </div>
                  <div
                    className="p-3 rounded-xl border-2 theme-border"
                    style={{ backgroundColor: zTheme.tile3 }}
                  >
                    <div className="font-mono-zine text-[10px] font-bold uppercase opacity-70">
                      IMPROVISED WEAPON
                    </div>
                    <div className="font-bold mt-0.5">{issue.weapon}</div>
                  </div>
                  <div
                    style={{ backgroundColor: zTheme.tile4 }}
                    className="p-3 rounded-xl border-2 theme-border sm:col-span-2"
                  >
                    <div className="font-mono-zine text-[10px] font-bold uppercase opacity-70">
                      ART DIRECTION &amp; LIGHTING
                    </div>
                    <div className="font-bold mt-0.5">
                      {issue.artStyle} • {issue.lightingMood}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- SPREAD 03: ACT 03 PROSE + WAVE TOY (LEFT) × GIF 02 & IMAGE 04 (RIGHT) ---------- */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-6">
              <article
                className="pop-card p-6 sm:p-8"
                style={{ backgroundColor: zTheme.tile3, color: zTheme.ink }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
                    style={{
                      backgroundColor: zTheme.popLime,
                      color: zTheme.popLimeInk,
                      boxShadow: '2px 2px 0 var(--ui-border)',
                    }}
                  >
                    ACT 03 // THE AFTERMATH
                  </span>
                  <span className="font-display text-5xl font-extrabold opacity-20 select-none">
                    03
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase leading-tight mb-4">
                  The Quiet Aftermath
                </h2>
                <p className="text-base sm:text-[17px] leading-[1.75] font-medium opacity-95 whitespace-pre-line">
                  {issue.acts.aftermath}
                </p>
              </article>

              <div
                onClick={handlePluckWave}
                style={{ backgroundColor: zTheme.surfaceBg }}
                className="pop-card p-4 cursor-pointer hover:-translate-y-0.5 transition-transform"
                title="Click to pluck the 199X synth wave!"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-zine text-xs font-bold uppercase">
                    🎹 Interactive 199X Synth Resonance Toy
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full border theme-border font-mono-zine text-[10px] font-bold"
                    style={{
                      backgroundColor: zTheme.heroYellow,
                      color: zTheme.heroYellowInk,
                    }}
                  >
                    CLICK TO PLUCK ♪
                  </span>
                </div>
                <canvas
                  ref={waveToyRef}
                  width={380}
                  height={68}
                  className="w-full h-[68px] rounded-xl border-2 theme-border"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              {renderShotPolaroid(
                3,
                zTheme.popLime,
                zTheme.popLimeInk,
                'lg:rotate-[0.8deg]'
              )}

              {renderStoryGifCard(
                'gif2',
                issue.prompts.sameChatGif2FollowupPrompt,
                issue.gifUrl2,
                undefined,
                '🎞️ GIF 02 // ACT III AFTERMATH LOOP',
                zTheme.popCyan,
                zTheme.popCyanInk,
                'FOLLOWS ACT 03 ∞',
                'lg:-rotate-[0.9deg]'
              )}
            </div>
          </section>
        </div>

        {/* ==================== 6.5 ACT III FINALE VIDEO CINEMA (END OF THE TALE!) ==================== */}
        {(!readerMode || Boolean(issue.outroVideoUrl)) && (
          <section
            onDragOver={(e) => {
              if (readerMode || !onDropSlotFile) return;
              e.preventDefault();
              setDragHoverSlot('outroVideo');
            }}
            onDragLeave={() => setDragHoverSlot(null)}
            onDrop={(e) => {
              if (readerMode || !onDropSlotFile) return;
              e.preventDefault();
              setDragHoverSlot(null);
              const f = e.dataTransfer.files?.[0];
              if (f) onDropSlotFile('outroVideo', f);
            }}
            style={{
              backgroundColor:
                dragHoverSlot === 'outroVideo' ? zTheme.tile3 : zTheme.surfaceBg,
            }}
            className="pop-card overflow-hidden"
          >
            <div
              className="px-4 py-2.5 border-b-[3px] theme-border flex flex-wrap items-center justify-between gap-2"
              style={{
                backgroundColor: zTheme.popPink,
                color: zTheme.popPinkInk,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFE600] border-2 border-[#121212]" />
                <span className="w-3.5 h-3.5 rounded-full bg-[#00F0FF] border-2 border-[#121212]" />
                <span className="font-mono-zine text-xs font-bold uppercase ml-1">
                  🎬 ACT III FINALE VIDEO // CLOSING THE TALE (16:9)
                </span>
              </div>

              {!readerMode && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      copyInlinePrompt(
                        'outroVideo',
                        issue.prompts.sameChatOutroVideoPrompt
                      )
                    }
                    style={{
                      backgroundColor:
                        inlineCopiedSlot === 'outroVideo'
                          ? '#10B981'
                          : zTheme.surfaceElevated,
                      color:
                        inlineCopiedSlot === 'outroVideo'
                          ? '#04130D'
                          : zTheme.ink,
                    }}
                    className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    {inlineCopiedSlot === 'outroVideo' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied Finale Prompt!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Finale Video Prompt
                      </>
                    )}
                  </button>

                  {onClickUploadSlot && (
                    <button
                      type="button"
                      onClick={() => onClickUploadSlot('outroVideo')}
                      style={{
                        backgroundColor: zTheme.heroYellow,
                        color: zTheme.heroYellowInk,
                      }}
                      className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />{' '}
                      {issue.outroVideoUrl ? 'Swap Finale MP4' : 'Add Finale Video'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {issue.outroVideoUrl ? (
              <div className="relative aspect-video w-full bg-[#121212] overflow-hidden">
                <video
                  src={issue.outroVideoUrl}
                  poster={shots[3]}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
                <div
                  className="pointer-events-none absolute top-3 left-3 px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-[11px] font-bold uppercase"
                  style={{
                    backgroundColor: zTheme.popLime,
                    color: zTheme.popLimeInk,
                  }}
                >
                  ★ FINALE OUTRO • CARDS CRYSTALLIZE
                </div>
              </div>
            ) : (
              <div
                onClick={() => !readerMode && onClickUploadSlot?.('outroVideo')}
                className="py-10 px-4 bg-[#121212] text-center flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Film className="w-7 h-7 text-pink-400" />
                <div className="font-display text-base font-extrabold uppercase text-white">
                  Drop Act III Finale Ending Video (.mp4) Here
                </div>
                <p className="font-mono-zine text-[11px] text-zinc-400 max-w-xl">
                  Closes the story with the anomaly dissolving into the 3 holographic collector cards below (stays hidden in exported HTML if left empty).
                </p>
              </div>
            )}
          </section>
        )}

        {/* ==================== 7. 3-CARD HOLOGRAPHIC BOOSTER PACK (DISC-GOLF FOIL STYLE!) ==================== */}
        <HoloBoosterPack
          issue={issue}
          surfaceBg={zTheme.cardBg}
          ink={zTheme.ink}
          accent1={zTheme.heroYellow}
          accent1Ink={zTheme.heroYellowInk}
          accent2={zTheme.popPink}
          accent2Ink={zTheme.popPinkInk}
          accent3={zTheme.popCyan}
          accent3Ink={zTheme.popCyanInk}
        />

        {/* ==================== 8. FINISH & SAVE ISSUE BAR ==================== */}
        {!readerMode && (
          <section
            className="pop-card p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4"
            style={{ backgroundColor: zTheme.mastheadBg, color: zTheme.mastheadInk }}
          >
            <div className="space-y-0.5">
              <div className="font-mono-zine text-xs font-black uppercase opacity-80">
                ★ ISSUE #{String(issue.issueNumber).padStart(2, '0')} READY TO PUBLISH
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase">
                Save This Zine to Your Shelf or Google Drive
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {onSaveToShelf && (
                <button
                  type="button"
                  onClick={() => void onSaveToShelf()}
                  disabled={isSavingShelf}
                  className="pop-btn px-5 py-2.5 font-display font-extrabold text-sm uppercase flex items-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: zTheme.popPink,
                    color: zTheme.popPinkInk,
                  }}
                >
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isSavingShelf
                      ? 'Saving...'
                      : isSavedOnShelf
                      ? '✓ Saved on Zine Shelf (Update)'
                      : 'Save to Zine Shelf'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                disabled={isExportingHtml}
                className="pop-btn px-5 py-2.5 font-display font-extrabold text-sm uppercase flex items-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: zTheme.popLime,
                  color: zTheme.popLimeInk,
                }}
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{exportMsg || 'Download .HTML Zine'}</span>
              </button>

              {onExportForDrive && (
                <button
                  type="button"
                  onClick={() => void onExportForDrive()}
                  className="pop-btn px-4 py-2.5 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  style={{
                    backgroundColor: zTheme.popCyan,
                    color: zTheme.popCyanInk,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>Save Drive Pack (.json)</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* ==================== 9. OPTIONAL CLASSIC SERIES 2 INSERT CARD (COLLAPSIBLE) ==================== */}
        <section
          style={{ backgroundColor: zTheme.surfaceBg }}
          className="pop-card p-4 sm:p-5 space-y-4"
        >
          <button
            type="button"
            onClick={() => {
              playZineBlip(840);
              setShowBonusCard((v) => !v);
            }}
            className="w-full flex flex-wrap items-center justify-between gap-2 cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
                style={{
                  backgroundColor: zTheme.heroYellow,
                  color: zTheme.heroYellowInk,
                }}
              >
                🃏 CLASSIC SERIES 2 VARIANT
              </span>
              <span className="font-display text-base sm:text-lg font-extrabold uppercase">
                Original 199X Engine Card View (#{String(issue.issueNumber).padStart(2, '0')})
              </span>
            </div>
            <span className="px-3 py-1 rounded-xl border-2 theme-border font-mono-zine text-xs font-bold flex items-center gap-1">
              {showBonusCard ? (
                <>
                  Hide <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Expand <ChevronDown className="w-4 h-4" />
                </>
              )}
            </span>
          </button>

          {showBonusCard && (
            <div className="pt-2 border-t-2 theme-border">
              <TradingCardVisual
                encounter={issue.encounter}
                imageUrl={resolvedCardImage}
                videoUrl={resolvedCardVideo}
                displaySide="front"
                cardNumber={issue.issueNumber}
                cardTheme={issue.encounter.card_theme}
                locationName={issue.location}
              />
            </div>
          )}
        </section>
      </div>

      {/* ==================== FULLSCREEN 2K POP-ZINE LIGHTBOX MODAL ==================== */}
      {lightboxPos !== null && presentShots[lightboxPos] && (
        <div
          onClick={() => setLightboxPos(null)}
          className="fixed inset-0 z-50 bg-[#121212]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: zTheme.surfaceBg, color: zTheme.ink }}
            className="relative max-w-[94vw] w-full pop-card p-3 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className="px-3.5 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
                style={{
                  backgroundColor: zTheme.heroYellow,
                  color: zTheme.heroYellowInk,
                }}
              >
                {SHOT_STICKERS[presentShots[lightboxPos].slotIdx]?.badge} (
                {lightboxPos + 1} / {presentShots.length})
              </span>

              <div className="flex items-center gap-2">
                {presentShots.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxPos(
                          (lightboxPos - 1 + presentShots.length) %
                            presentShots.length
                        )
                      }
                      style={{
                        backgroundColor: zTheme.surfaceElevated,
                        color: zTheme.ink,
                      }}
                      className="pop-btn px-3 py-1.5 font-mono-zine text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxPos((lightboxPos + 1) % presentShots.length)
                      }
                      style={{
                        backgroundColor: zTheme.surfaceElevated,
                        color: zTheme.ink,
                      }}
                      className="pop-btn px-3 py-1.5 font-mono-zine text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxPos(null)}
                  className="pop-btn px-3 py-1.5 font-mono-zine text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                  style={{
                    backgroundColor: zTheme.popPink,
                    color: zTheme.popPinkInk,
                  }}
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            </div>

            <div className="rounded-xl border-[3px] theme-border bg-[#121212] overflow-hidden flex items-center justify-center">
              <img
                src={presentShots[lightboxPos].url}
                alt="2K Lightbox Plate"
                className="max-h-[86vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
