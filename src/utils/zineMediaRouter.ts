export interface MediaFileMeta<T = File> {
  file: T;
  name: string;
  type: string;
  lastModified: number;
  durationSec?: number | null;
}

export interface UnifiedMediaRoutePlan<T = File> {
  zineJsonFiles: T[];
  audio?: T;
  storyboardSheet?: T;
  individualStills: T[];
  gif1?: T;
  gif2?: T;
  video1?: T;
  video2?: T;
}

export interface ExistingSlotState {
  hasGif1: boolean;
  hasGif2: boolean;
  hasVideo1: boolean;
  hasVideo2: boolean;
}

const NAT_COMPARE = (aName: string, bName: string): number =>
  aName.localeCompare(bName, undefined, {
    numeric: true,
    sensitivity: 'base',
  });

/**
 * Chronological sort (earliest download/creation first) when timestamps differ by >500ms,
 * falling back to natural filename ordering when timestamps match (e.g. batch unzip/copy).
 */
export function chronoSortMeta<T>(a: MediaFileMeta<T>, b: MediaFileMeta<T>): number {
  const diff = (a.lastModified || 0) - (b.lastModified || 0);
  if (Math.abs(diff) > 500) return diff;
  return NAT_COMPARE(a.name, b.name);
}

/**
 * Probes a video File's duration in seconds using an in-memory HTMLVideoElement.
 * Safely resolves to null on error, unsupported codecs, or after timeoutMs.
 */
export function probeVideoDurationSec(file: File, timeoutMs: number = 1200): Promise<number | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.muted = true;
    let settled = false;

    const finish = (val: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      vid.removeAttribute('src');
      try {
        vid.load();
      } catch {
        // ignore cleanup errors
      }
      URL.revokeObjectURL(url);
      resolve(val);
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);
    vid.onloadedmetadata = () => {
      const dur = Number.isFinite(vid.duration) && vid.duration > 0 ? vid.duration : null;
      finish(dur);
    };
    vid.onerror = () => finish(null);
    vid.src = url;
  });
}

function isOutroName(name: string): boolean {
  return /(outro|finale|ending|\bend\b|act[-_ ]?3|part[-_ ]?2|video[-_ ]?2|\bv2\b)/i.test(name);
}

function isLeadName(name: string): boolean {
  return /(lead|hero|main|mayhem|act[-_ ]?2|part[-_ ]?1|video[-_ ]?1|\bv1\b)/i.test(name);
}

function isGifName(name: string): boolean {
  return /(gif|loop)/i.test(name);
}

function orderTwoVideos<T>(a: MediaFileMeta<T>, b: MediaFileMeta<T>): [T, T] {
  const aOutro = isOutroName(a.name);
  const bOutro = isOutroName(b.name);
  const aLead = isLeadName(a.name);
  const bLead = isLeadName(b.name);

  if (aOutro && !bOutro) return [b.file, a.file];
  if (bOutro && !aOutro) return [a.file, b.file];
  if (bLead && !aLead) return [b.file, a.file];
  if (aLead && !bLead) return [a.file, b.file];

  const sorted = [a, b].sort(chronoSortMeta);
  return [sorted[0].file, sorted[1].file];
}

/**
 * Pure deterministic router for the All-in-One 6-File Drop Zone:
 * - 1 still image -> auto-sliced as the 2x2 Master Storyboard Sheet into all 4 story panels
 * - 2+ still images -> individual Shots 01..04
 * - Audio (.mp3/.wav/.m4a/etc.) -> Soundtrack
 * - .zine.json / .zineshelf.json -> Zine Shelf import
 * - GIFs + MP4/WebM/MOV clips:
 *   * Explicit .gif files or filenames with "gif"/"loop" route to GIF #1 & GIF #2
 *   * If 4 video clips are dropped together (classic Google Flow run: 2 loops + 2 full videos):
 *     - If 2 clips are clearly shorter than the other 2 (delta >= 1.0s), shorter 2 -> GIF #1/#2, longer 2 -> Video 1/2
 *     - Otherwise (all 4 same Veo length, e.g. 8s), sort chronologically Step 2 -> Step 3:
 *       #1 -> GIF #1 (Act I), #2 -> GIF #2 (Act III), #3 -> Video 1 (Mayhem), #4 -> Video 2 (Ending)
 *   * If 2 video clips are dropped alongside 0 GIFs -> Video 1 & Video 2 (or if Video 1 & 2 are already filled, GIF #1 & #2)
 */
export function planUnifiedMediaRouting<T>(
  items: MediaFileMeta<T>[],
  existing: ExistingSlotState = {
    hasGif1: false,
    hasGif2: false,
    hasVideo1: false,
    hasVideo2: false,
  }
): UnifiedMediaRoutePlan<T> {
  const zineJsonFiles: T[] = [];
  const audios: MediaFileMeta<T>[] = [];
  const explicitGifs: MediaFileMeta<T>[] = [];
  const videos: MediaFileMeta<T>[] = [];
  const stills: MediaFileMeta<T>[] = [];

  for (const item of items) {
    const lower = item.name.toLowerCase();
    if (/\.zine(?:shelf)?\.json$/i.test(lower)) {
      zineJsonFiles.push(item.file);
    } else if (
      item.type.startsWith('audio/') ||
      /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(lower)
    ) {
      audios.push(item);
    } else if (item.type === 'image/gif' || /\.gif$/i.test(lower)) {
      explicitGifs.push(item);
    } else if (
      item.type.startsWith('video/') ||
      /\.(mp4|webm|mov|m4v)$/i.test(lower)
    ) {
      if (isGifName(lower)) {
        explicitGifs.push(item);
      } else {
        videos.push(item);
      }
    } else if (
      item.type.startsWith('image/') ||
      /\.(png|jpg|jpeg|webp|avif)$/i.test(lower)
    ) {
      stills.push(item);
    }
  }

  const plan: UnifiedMediaRoutePlan<T> = {
    zineJsonFiles,
    individualStills: [],
  };

  // 1. Audio
  if (audios.length > 0) {
    audios.sort(chronoSortMeta);
    plan.audio = audios[0].file;
  }

  // 2. Stills (1 image -> Master 2x2 Sheet auto-slice; 2+ -> individual shots)
  if (stills.length === 1) {
    plan.storyboardSheet = stills[0].file;
  } else if (stills.length >= 2) {
    stills.sort((a, b) => NAT_COMPARE(a.name, b.name));
    plan.individualStills = stills.map((s) => s.file);
  }

  // 3. Explicit GIFs + Video Clips
  explicitGifs.sort(chronoSortMeta);

  // Assign explicit GIFs first
  if (explicitGifs.length >= 2) {
    plan.gif1 = explicitGifs[0].file;
    plan.gif2 = explicitGifs[1].file;
  } else if (explicitGifs.length === 1) {
    if (!existing.hasGif1) plan.gif1 = explicitGifs[0].file;
    else plan.gif2 = explicitGifs[0].file;
  }

  // Now route untagged video clips (.mp4 / .webm / .mov)
  if (videos.length >= 4 && explicitGifs.length === 0) {
    // Classic 4-video Google Flow drop (GIF #1, GIF #2, Video 1, Video 2)!
    const allHaveDur = videos.every(
      (v) => typeof v.durationSec === 'number' && Number.isFinite(v.durationSec) && v.durationSec > 0
    );
    let gifPair: MediaFileMeta<T>[] | null = null;
    let vidPair: MediaFileMeta<T>[] | null = null;

    if (allHaveDur) {
      const byDur = [...videos].sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0));
      const shortMax = byDur[1].durationSec || 0;
      const longMin = byDur[2].durationSec || 0;
      // Clear duration split (e.g. ~4s GIF loops vs ~8s full videos)
      if (longMin - shortMax >= 1.0) {
        gifPair = [byDur[0], byDur[1]].sort(chronoSortMeta);
        vidPair = [byDur[2], byDur[3]];
      }
    }

    if (!gifPair || !vidPair) {
      // Same duration (e.g. Veo outputs 8s for all 4): follow Step 2 -> Step 3 chronological download order!
      const chrono = [...videos].sort(chronoSortMeta);
      gifPair = [chrono[0], chrono[1]];
      vidPair = [chrono[2], chrono[3]];
    }

    plan.gif1 = gifPair[0].file;
    plan.gif2 = gifPair[1].file;
    const [v1, v2] = orderTwoVideos(vidPair[0], vidPair[1]);
    plan.video1 = v1;
    plan.video2 = v2;
  } else if (videos.length === 3 && explicitGifs.length === 0) {
    const allHaveDur = videos.every(
      (v) => typeof v.durationSec === 'number' && Number.isFinite(v.durationSec) && v.durationSec > 0
    );
    let pickedGif: MediaFileMeta<T>;
    let remaining: [MediaFileMeta<T>, MediaFileMeta<T>];

    if (allHaveDur) {
      const byDur = [...videos].sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0));
      if ((byDur[1].durationSec || 0) - (byDur[0].durationSec || 0) >= 1.0) {
        pickedGif = byDur[0];
        remaining = [byDur[1], byDur[2]];
      } else {
        const chrono = [...videos].sort(chronoSortMeta);
        pickedGif = chrono[0];
        remaining = [chrono[1], chrono[2]];
      }
    } else {
      const chrono = [...videos].sort(chronoSortMeta);
      pickedGif = chrono[0];
      remaining = [chrono[1], chrono[2]];
    }

    if (!existing.hasGif1) plan.gif1 = pickedGif.file;
    else plan.gif2 = pickedGif.file;
    const [v1, v2] = orderTwoVideos(remaining[0], remaining[1]);
    plan.video1 = v1;
    plan.video2 = v2;
  } else if (videos.length === 3 && explicitGifs.length === 1) {
    const chrono = [...videos].sort(chronoSortMeta);
    if (!plan.gif1) plan.gif1 = chrono[0].file;
    else plan.gif2 = chrono[0].file;
    const [v1, v2] = orderTwoVideos(chrono[1], chrono[2]);
    plan.video1 = v1;
    plan.video2 = v2;
  } else if (videos.length >= 2) {
    const sorted = [...videos].sort(chronoSortMeta);
    // If both main videos are already loaded and GIFs are empty, fill GIF #1 & GIF #2!
    if (
      explicitGifs.length === 0 &&
      existing.hasVideo1 &&
      existing.hasVideo2 &&
      !existing.hasGif1 &&
      !existing.hasGif2
    ) {
      plan.gif1 = sorted[0].file;
      plan.gif2 = sorted[1].file;
    } else {
      const [v1, v2] = orderTwoVideos(sorted[0], sorted[1]);
      plan.video1 = v1;
      plan.video2 = v2;
    }
  } else if (videos.length === 1) {
    const v = videos[0];
    if (isOutroName(v.name)) {
      plan.video2 = v.file;
    } else if (isLeadName(v.name)) {
      plan.video1 = v.file;
    } else if (!existing.hasVideo1) {
      plan.video1 = v.file;
    } else if (!existing.hasVideo2) {
      plan.video2 = v.file;
    } else if (!existing.hasGif1 && !plan.gif1) {
      plan.gif1 = v.file;
    } else if (!existing.hasGif2 && !plan.gif2) {
      plan.gif2 = v.file;
    } else {
      plan.video2 = v.file;
    }
  }

  return plan;
}
