import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Upload,
  Copy,
  Check,
  Sparkles,
  Trash2,
  Film,
  Image as ImageIcon,
  Music,
  Save,
  Smartphone,
  Eye,
  EyeOff,
  FileText,
  Download,
  FolderOpen,
  FolderSync,
  RefreshCw,
  Package,
  X,
} from 'lucide-react';
import { CombatEncounter } from '../types';
import {
  ZineIssueData,
  ZineActs,
  buildZineIssueFromEncounter,
  buildLongForm3ActChronicle,
  parsePasted3ActStory,
} from '../engine/zineEngine';
import { StudioUiTheme } from '../data/uiThemes';
import { ZinePaletteId, getZinePalette } from '../data/zinePalettes';
import {
  ZineShelfRecord,
  saveZineIssueToShelf,
  deleteZineShelfIssue,
  exportZineIssueForDrive,
  exportEntireZineShelfForDrive,
  importZineFilesFromDrive,
} from '../utils/zineStorage';
import {
  SyncDirHandle,
  isFolderSyncSupported,
  getSavedSyncFolderHandle,
  getSyncFolderPermissionState,
  pickAndSaveSyncFolder,
  disconnectSyncFolder,
  syncShelfWithFolder,
  pushSingleRecordToConnectedFolder,
  removeRecordFromConnectedFolder,
} from '../utils/zineFolderSync';
import { exportStandaloneZineHtml } from '../utils/zineHtmlExporter';
import { slice2x2StoryboardInto4Shots } from '../utils/storyboardSlicer';
import {
  render199x3ActSynthTrackWav,
  SYNTH_STYLE_PRESETS,
} from '../utils/synthTrackRenderer';
import { ZineIssueView, ZineMediaSlotKey } from './ZineIssueView';
import { playZineBlip, playZineResonanceChime } from '../utils/audio';

interface ZineStudioTabProps {
  encounter: CombatEncounter;
  uiTheme: StudioUiTheme;
  shelfRecords: ZineShelfRecord[];
  hydratedShelfIssues: ZineIssueData[];
  onRefreshShelf: () => Promise<void>;
  onOpenPocketReader: () => void;
  onLiveDraftChange?: (draft: ZineIssueData) => void;
  onLoadShelfEncounter?: (encounter: CombatEncounter) => void;
  activeSubTab?: 'builder' | 'shelf';
  onSubTabChange?: (tab: 'builder' | 'shelf') => void;
}

export const ZineStudioTab: React.FC<ZineStudioTabProps> = ({
  encounter,
  uiTheme,
  shelfRecords,
  hydratedShelfIssues,
  onRefreshShelf,
  onOpenPocketReader,
  onLiveDraftChange,
  onLoadShelfEncounter,
  activeSubTab,
  onSubTabChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<'builder' | 'shelf'>('builder');
  const subTab = activeSubTab || internalSubTab;
  const setSubTab = (next: 'builder' | 'shelf') => {
    setInternalSubTab(next);
    onSubTabChange?.(next);
  };
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPromptInspector, setShowPromptInspector] = useState(false);
  const [showStoryPasteBox, setShowStoryPasteBox] = useState(false);
  const [showAdvanced8, setShowAdvanced8] = useState(false);
  const [storyPasteText, setStoryPasteText] = useState('');
  const [isAiExpanding, setIsAiExpanding] = useState(false);
  const [isSlicingSheet, setIsSlicingSheet] = useState(false);
  const [isComposingAudio, setIsComposingAudio] = useState(false);
  const [synthStyleIdx, setSynthStyleIdx] = useState<number>(0);
  const [isSavingShelf, setIsSavingShelf] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSheetDragOver, setIsSheetDragOver] = useState(false);
  const [isStep2GifDragOver, setIsStep2GifDragOver] = useState(false);
  const [isStep3DragOver, setIsStep3DragOver] = useState(false);
  const [isShelfDragOver, setIsShelfDragOver] = useState(false);
  const [isExportingShelf, setIsExportingShelf] = useState(false);

  // Shared Folder Sync state (Chrome / Antigravity Chromium File System Access API)
  const folderSyncSupported = isFolderSyncSupported();
  const [syncFolderHandle, setSyncFolderHandle] = useState<SyncDirHandle | null>(null);
  const [syncFolderNeedsGrant, setSyncFolderNeedsGrant] = useState<boolean>(false);
  const [isSyncingFolder, setIsSyncingFolder] = useState<boolean>(false);
  const [lastSyncNote, setLastSyncNote] = useState<string | null>(null);

  // Active Issue Editable State
  const [editingRecordId, setEditingRecordId] = useState<string | undefined>(undefined);
  const editingRecordIdRef = useRef<string | undefined>(undefined);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const skipNextAutoSaveRef = useRef<boolean>(false);
  const [issueNumber, setIssueNumber] = useState<number>(
    encounter.card_number || shelfRecords.length + 1
  );
  const [zinePaletteId, setZinePaletteId] = useState<ZinePaletteId>(
    getZinePalette(encounter.card_theme).finishId
  );
  const [acts, setActs] = useState<ZineActs>(() =>
    buildLongForm3ActChronicle(encounter)
  );
  const [audioTitle, setAudioTitle] = useState<string>(
    `199X ${encounter.theme_set_badge || 'Suburban'} Synthwave Tape`
  );

  // Media Slots (Blobs + Object URLs)
  const [videoBlob, setVideoBlob] = useState<Blob | undefined>();
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [outroVideoBlob, setOutroVideoBlob] = useState<Blob | undefined>();
  const [outroVideoUrl, setOutroVideoUrl] = useState<string | undefined>();

  const [shotBlobs, setShotBlobs] = useState<(Blob | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const [shotUrls, setShotUrls] = useState<(string | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  const [gif1Blob, setGif1Blob] = useState<Blob | undefined>();
  const [gif1Url, setGif1Url] = useState<string | undefined>();
  const [gif1IsVideo, setGif1IsVideo] = useState(false);

  const [gif2Blob, setGif2Blob] = useState<Blob | undefined>();
  const [gif2Url, setGif2Url] = useState<string | undefined>();
  const [gif2IsVideo, setGif2IsVideo] = useState(false);

  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();

  // Hidden file inputs for batch drop & individual slot swaps
  const batchInputRef = useRef<HTMLInputElement>(null);
  const storyboardInputRef = useRef<HTMLInputElement>(null);
  const step2GifsInputRef = useRef<HTMLInputElement>(null);
  const step3MediaInputRef = useRef<HTMLInputElement>(null);
  const drivePackInputRef = useRef<HTMLInputElement>(null);
  const leadVideoInputRef = useRef<HTMLInputElement>(null);
  const outroVideoInputRef = useRef<HTMLInputElement>(null);
  const gif1InputRef = useRef<HTMLInputElement>(null);
  const gif2InputRef = useRef<HTMLInputElement>(null);
  const songInputRef = useRef<HTMLInputElement>(null);
  const shotInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset draft whenever a brand-new encounter is rolled in Card Studio
  const prevEncounterRef = useRef<CombatEncounter>(encounter);
  useEffect(() => {
    if (prevEncounterRef.current === encounter) return;
    prevEncounterRef.current = encounter;

    editingRecordIdRef.current = undefined;
    setEditingRecordId(undefined);
    setIssueNumber(shelfRecords.length + 1);
    setZinePaletteId(getZinePalette(encounter.card_theme).finishId);
    setActs(buildLongForm3ActChronicle(encounter));
    setAudioTitle(
      `199X ${encounter.theme_set_badge || 'Suburban'} Synthwave Tape`
    );

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (outroVideoUrl) URL.revokeObjectURL(outroVideoUrl);
    shotUrls.forEach((u) => u && URL.revokeObjectURL(u));
    if (gif1Url) URL.revokeObjectURL(gif1Url.split('#')[0]);
    if (gif2Url) URL.revokeObjectURL(gif2Url.split('#')[0]);
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setVideoBlob(undefined);
    setVideoUrl(undefined);
    setOutroVideoBlob(undefined);
    setOutroVideoUrl(undefined);
    setShotBlobs([undefined, undefined, undefined, undefined]);
    setShotUrls([undefined, undefined, undefined, undefined]);
    setGif1Blob(undefined);
    setGif1Url(undefined);
    setGif1IsVideo(false);
    setGif2Blob(undefined);
    setGif2Url(undefined);
    setGif2IsVideo(false);
    setAudioBlob(undefined);
    setAudioUrl(undefined);
  }, [encounter]);

  const bannerTimerRef = useRef<number | null>(null);
  const flashBanner = useCallback((msg: string) => {
    setStatusBanner(msg);
    if (bannerTimerRef.current !== null) {
      window.clearTimeout(bannerTimerRef.current);
    }
    bannerTimerRef.current = window.setTimeout(() => {
      setStatusBanner(null);
      bannerTimerRef.current = null;
    }, 3200);
  }, []);

  // Assemble live ZineIssueData
  const liveIssue: ZineIssueData = React.useMemo(() => {
    const built = buildZineIssueFromEncounter(encounter, issueNumber, {
      acts,
      videoUrl,
      outroVideoUrl,
      galleryUrls: shotUrls,
      gifUrl: gif1Url,
      gifUrl2: gif2Url,
      audioUrl,
      audioTitle,
      cardImageUrl: shotUrls[2] || shotUrls[1] || shotUrls[0],
      cardVideoUrl: videoUrl,
    });
    if (editingRecordId) built.id = editingRecordId;
    built.zinePaletteId = zinePaletteId;
    return built;
  }, [
    encounter,
    issueNumber,
    acts,
    videoUrl,
    outroVideoUrl,
    shotUrls,
    gif1Url,
    gif2Url,
    audioUrl,
    audioTitle,
    editingRecordId,
    zinePaletteId,
  ]);

  useEffect(() => {
    onLiveDraftChange?.(liveIssue);
  }, [liveIssue, onLiveDraftChange]);

  const assignLeadVideo = (file: Blob) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  const assignOutroVideo = (file: Blob) => {
    if (outroVideoUrl) URL.revokeObjectURL(outroVideoUrl);
    setOutroVideoBlob(file);
    setOutroVideoUrl(URL.createObjectURL(file));
  };

  const assignGif1 = (file: Blob, fileName: string = '') => {
    if (gif1Url) URL.revokeObjectURL(gif1Url.split('#')[0]);
    const isVid =
      file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(fileName);
    setGif1Blob(file);
    setGif1IsVideo(isVid);
    const raw = URL.createObjectURL(file);
    setGif1Url(isVid ? `${raw}#video` : raw);
  };

  const assignGif2 = (file: Blob, fileName: string = '') => {
    if (gif2Url) URL.revokeObjectURL(gif2Url.split('#')[0]);
    const isVid =
      file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(fileName);
    setGif2Blob(file);
    setGif2IsVideo(isVid);
    const raw = URL.createObjectURL(file);
    setGif2Url(isVid ? `${raw}#video` : raw);
  };

  const assignSong = (file: Blob, fileName?: string) => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    if (fileName) {
      const cleanTitle = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      if (cleanTitle) setAudioTitle(cleanTitle);
    }
  };

  const assignShotSlot = (slotIdx: number, file: Blob | undefined) => {
    setShotBlobs((prev) => {
      const next = [...prev];
      next[slotIdx] = file;
      return next;
    });
    setShotUrls((prev) => {
      const next = [...prev];
      if (next[slotIdx]) URL.revokeObjectURL(next[slotIdx]!);
      next[slotIdx] = file ? URL.createObjectURL(file) : undefined;
      return next;
    });
  };

  // Smart 8-File Batch Router
  const handleBatchFilesDrop = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;
      playZineResonanceChime();

      const audios: File[] = [];
      const gifs: File[] = [];
      const videos: File[] = [];
      const stills: File[] = [];

      for (const f of files) {
        const lower = f.name.toLowerCase();
        if (
          f.type.startsWith('audio/') ||
          /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(lower)
        ) {
          audios.push(f);
        } else if (f.type === 'image/gif' || /\.gif$/i.test(lower)) {
          gifs.push(f);
        } else if (
          f.type.startsWith('video/') ||
          /\.(mp4|webm|mov|m4v)$/i.test(lower)
        ) {
          if (/(gif|loop)/i.test(lower)) {
            gifs.push(f);
          } else {
            videos.push(f);
          }
        } else if (
          f.type.startsWith('image/') ||
          /\.(png|jpg|jpeg|webp|avif)$/i.test(lower)
        ) {
          stills.push(f);
        }
      }

      // Natural filename sort so shot1..shot4 and gif1..gif2 land in exact slots
      const natSort = (a: File, b: File) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      gifs.sort(natSort);
      stills.sort(natSort);

      let assignedCount = 0;

      if (audios[0]) {
        assignSong(audios[0], audios[0].name);
        assignedCount++;
      }

      if (videos.length > 0) {
        for (const vid of videos) {
          const isOutroName = /(outro|finale|end|ending|act3|part2|video2)/i.test(vid.name);
          if (isOutroName || (videoUrl && !outroVideoUrl)) {
            assignOutroVideo(vid);
          } else if (!videoUrl) {
            assignLeadVideo(vid);
          } else {
            assignOutroVideo(vid);
          }
          assignedCount++;
        }
      }

      if (gifs.length === 1) {
        if (!gif1Blob) assignGif1(gifs[0], gifs[0].name);
        else assignGif2(gifs[0], gifs[0].name);
        assignedCount++;
      } else if (gifs.length >= 2) {
        assignGif1(gifs[0], gifs[0].name);
        assignGif2(gifs[1], gifs[1].name);
        assignedCount += 2;
      }

      if (stills.length > 0) {
        if (stills.length >= 4) {
          for (let i = 0; i < 4; i++) {
            assignShotSlot(i, stills[i]);
            assignedCount++;
          }
        } else {
          // Fill explicit numbered slots if named shot1..shot4, else fill empty slots first
          const nextBlobs = [...shotBlobs];
          const nextUrls = [...shotUrls];
          let cursor = 0;
          for (const imgFile of stills) {
            const explicitMatch = imgFile.name.match(/(?:shot|img|print)[_-]?0?([1-4])/i);
            let targetIdx = explicitMatch ? Number(explicitMatch[1]) - 1 : -1;
            if (targetIdx < 0 || targetIdx > 3) {
              const emptyIdx = nextBlobs.findIndex((b) => !b);
              targetIdx = emptyIdx >= 0 ? emptyIdx : cursor % 4;
              cursor++;
            }
            if (nextUrls[targetIdx]) URL.revokeObjectURL(nextUrls[targetIdx]!);
            nextBlobs[targetIdx] = imgFile;
            nextUrls[targetIdx] = URL.createObjectURL(imgFile);
            assignedCount++;
          }
          setShotBlobs(nextBlobs);
          setShotUrls(nextUrls);
        }
      }

      flashBanner(`✓ Auto-routed ${assignedCount} media file(s) into Zine slots!`);
    },
    [gif1Blob, shotBlobs, shotUrls, videoUrl, gif1Url, gif2Url, audioUrl]
  );

  const handleCopyPrompt = async (key: string, text: string) => {
    playZineBlip(900);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // ignore
    }
  };

  const handleCopyAll8Prompts = async () => {
    const p = liveIssue.prompts;
    const bundle = [
      `=== 199X ZINE ISSUE: ${liveIssue.title} ===`,
      `\n[1. LEAD 16:9 HERO VIDEO PROMPT]\n${p.leadVideo16x9}`,
      `\n[2. SHOT 01 — WIDE ARCHITECTURE (NO CLOSE-UP CHARACTERS)]\n${p.shot01WideArchitecture}`,
      `\n[3. SHOT 02 — PURE ANOMALY PORTRAIT]\n${p.shot02AnomalyPortrait}`,
      `\n[4. SHOT 03 — LOW-ANGLE CHARACTER ACTION]\n${p.shot03LowAngleAction}`,
      `\n[5. SHOT 04 — OVERHEAD TABLETOP GEAR & CARD FLAT-LAY]\n${p.shot04TabletopGearFlatlay}`,
      `\n[6. STORY GIF #1 — ACT I TENSION LOOP (16:9)]\n${p.gif01Act1TensionLoop}`,
      `\n[7. STORY GIF #2 — ACT III AFTERMATH LOOP (16:9)]\n${p.gif02Act3AftermathLoop}`,
      `\n[8. SYNTH SONG PROMPT]\n${p.synthSongPrompt}`,
    ].join('\n');
    await handleCopyPrompt('all-8', bundle);
  };

  const handleAiRemixStory = async () => {
    if (isAiExpanding) return;
    playZineBlip(840);
    setIsAiExpanding(true);
    try {
      const res = await fetch('/api/zine-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encounter }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.sceneSetup && data?.intervention && data?.aftermath) {
          setActs({
            sceneSetup: data.sceneSetup,
            intervention: data.intervention,
            aftermath: data.aftermath,
          });
          flashBanner('✓ Expanded 3-Act Chronicle (~950 words)!');
        }
      } else {
        setActs(buildLongForm3ActChronicle(encounter));
      }
    } catch {
      setActs(buildLongForm3ActChronicle(encounter));
    } finally {
      setIsAiExpanding(false);
    }
  };

  const handleApplyPastedStory = () => {
    const parsed = parsePasted3ActStory(storyPasteText);
    if (!parsed) return;
    playZineResonanceChime();
    setActs(parsed);
    setStoryPasteText('');
    setShowStoryPasteBox(false);
    flashBanner('✓ Pasted 3-Act Chronicle applied to Zine Spreads!');
  };

  const persistCurrentDraftToShelf = useCallback(
    (opts?: { silent?: boolean }) => {
      const task = saveQueueRef.current.then(async () => {
        if (!opts?.silent) setIsSavingShelf(true);
        try {
          const saved = await saveZineIssueToShelf({
            id: editingRecordIdRef.current,
            issueNumber,
            title: encounter.entity_name,
            zinePaletteId,
            encounter,
            acts,
            audioTitle,
            videoBlob,
            outroVideoBlob,
            shotBlobs,
            gif1Blob,
            gif1IsVideo,
            gif2Blob,
            gif2IsVideo,
            audioBlob,
          });
          editingRecordIdRef.current = saved.id;
          setEditingRecordId(saved.id);
          setIssueNumber(saved.issueNumber);
          const pushedToFolder = await pushSingleRecordToConnectedFolder(saved);
          await onRefreshShelf();
          if (opts?.silent) {
            flashBanner(
              pushedToFolder
                ? `✓ Auto-saved Issue #${String(saved.issueNumber).padStart(2, '0')} to Shelf & Sync Folder`
                : `✓ Auto-saved Issue #${String(saved.issueNumber).padStart(2, '0')} to Zine Shelf`
            );
          } else {
            flashBanner(
              pushedToFolder
                ? `✓ Saved Issue #${String(saved.issueNumber).padStart(2, '0')} to Shelf & Sync Folder!`
                : `✓ Saved Issue #${String(saved.issueNumber).padStart(2, '0')} to Zine Shelf!`
            );
          }
        } catch (err) {
          console.error('Zine Shelf save failed:', err);
          flashBanner('⚠ Browser storage full or blocked — use Save for Drive (.zine.json)!');
        } finally {
          if (!opts?.silent) setIsSavingShelf(false);
        }
      });
      saveQueueRef.current = task.catch(() => {});
      return task;
    },
    [
      issueNumber,
      encounter,
      zinePaletteId,
      acts,
      audioTitle,
      videoBlob,
      outroVideoBlob,
      shotBlobs,
      gif1Blob,
      gif1IsVideo,
      gif2Blob,
      gif2IsVideo,
      audioBlob,
      onRefreshShelf,
    ]
  );

  // Auto-save to Zine Shelf automatically whenever user drops/generates any media!
  const hasAnyMediaLoaded = Boolean(
    videoBlob ||
      outroVideoBlob ||
      shotBlobs.some(Boolean) ||
      gif1Blob ||
      gif2Blob ||
      audioBlob
  );

  useEffect(() => {
    if (!hasAnyMediaLoaded) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void persistCurrentDraftToShelf({ silent: true });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [
    hasAnyMediaLoaded,
    videoBlob,
    outroVideoBlob,
    shotBlobs,
    gif1Blob,
    gif2Blob,
    audioBlob,
    acts,
    zinePaletteId,
    persistCurrentDraftToShelf,
  ]);

  const handleSaveIssueToShelf = async () => {
    if (isSavingShelf) return;
    playZineResonanceChime();
    await persistCurrentDraftToShelf({ silent: false });
  };

  const handleExportForDrive = async () => {
    playZineBlip(880);
    await handleSaveIssueToShelf();
    flashBanner('Packing Zine for Google Drive...');
    await exportZineIssueForDrive(liveIssue, {
      videoBlob,
      outroVideoBlob,
      shotBlobs,
      gif1Blob,
      gif1IsVideo,
      gif2Blob,
      gif2IsVideo,
      audioBlob,
    });
    flashBanner('✓ Downloaded .zine.json — drop into Google Drive to open on mobile!');
  };

  const runFolderSync = useCallback(
    async (
      handle: SyncDirHandle,
      opts?: { requestPermission?: boolean; quiet?: boolean }
    ) => {
      if (isSyncingFolder) return;
      setIsSyncingFolder(true);
      try {
        const res = await syncShelfWithFolder(handle, {
          requestPermission: opts?.requestPermission,
        });
        if (res.needsPermission) {
          setSyncFolderNeedsGrant(true);
          if (!opts?.quiet) {
            flashBanner(`Click "Sync ${res.folderName}" to allow folder access`);
          }
          return;
        }
        setSyncFolderNeedsGrant(false);
        await onRefreshShelf();
        const summary =
          res.pulled > 0 || res.pushed > 0
            ? `Synced "${res.folderName}" (↓ ${res.pulled} pulled, ↑ ${res.pushed} pushed)`
            : `In sync with "${res.folderName}" (${res.total} issues)`;
        setLastSyncNote(summary);
        if (!opts?.quiet || res.pulled > 0) {
          flashBanner(`✓ ${summary}`);
        }
      } catch (err) {
        console.warn('Folder sync warning:', err);
        if (!opts?.quiet) {
          flashBanner('⚠ Could not sync folder — try reconnecting');
        }
      } finally {
        setIsSyncingFolder(false);
      }
    },
    [isSyncingFolder, onRefreshShelf]
  );

  // Restore saved Sync Folder handle on mount & auto-sync on window focus!
  useEffect(() => {
    if (!folderSyncSupported) return;
    let cancelled = false;

    const init = async () => {
      const savedHandle = await getSavedSyncFolderHandle();
      if (cancelled || !savedHandle) return;
      setSyncFolderHandle(savedHandle);
      const perm = await getSyncFolderPermissionState(savedHandle);
      if (perm === 'granted') {
        setSyncFolderNeedsGrant(false);
        await runFolderSync(savedHandle, { requestPermission: false, quiet: true });
      } else {
        setSyncFolderNeedsGrant(true);
      }
    };
    void init();

    const handleWindowFocus = async () => {
      const savedHandle = await getSavedSyncFolderHandle();
      if (!savedHandle) return;
      const perm = await getSyncFolderPermissionState(savedHandle);
      if (perm === 'granted') {
        await runFolderSync(savedHandle, { requestPermission: false, quiet: true });
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [folderSyncSupported]);

  const handleConnectOrSyncFolder = async () => {
    playZineBlip(880);
    try {
      if (syncFolderHandle) {
        await runFolderSync(syncFolderHandle, { requestPermission: true });
        return;
      }
      const picked = await pickAndSaveSyncFolder();
      if (!picked) return;
      setSyncFolderHandle(picked);
      setSyncFolderNeedsGrant(false);
      playZineResonanceChime();
      await runFolderSync(picked, { requestPermission: true });
    } catch {
      flashBanner('⚠ Folder picker was blocked or unsupported here');
    }
  };

  const handleDisconnectSyncFolder = async () => {
    playZineBlip(620);
    await disconnectSyncFolder();
    setSyncFolderHandle(null);
    setSyncFolderNeedsGrant(false);
    setLastSyncNote(null);
    flashBanner('Disconnected shared sync folder');
  };

  const handleExportWholeShelf = async () => {
    if (isExportingShelf) return;
    playZineBlip(880);
    setIsExportingShelf(true);
    try {
      flashBanner('Packing entire Zine Shelf into 1 file...');
      const count = await exportEntireZineShelfForDrive();
      if (count === 0) {
        flashBanner('No saved zines on Shelf yet to export');
      } else {
        playZineResonanceChime();
        flashBanner(`✓ Exported all ${count} Zine(s) as 1 .zineshelf.json file!`);
      }
    } catch {
      flashBanner('⚠ Failed to export Zine Shelf bundle');
    } finally {
      setIsExportingShelf(false);
    }
  };

  const handleImportDriveFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    try {
      playZineResonanceChime();
      flashBanner('Importing Zine file(s) onto Shelf...');
      const res = await importZineFilesFromDrive(files);
      await onRefreshShelf();
      // Also push any newly imported zines to connected sync folder if active
      for (const rec of res.records) {
        void pushSingleRecordToConnectedFolder(rec);
      }
      if (res.records.length === 1 && subTab === 'builder') {
        handleLoadShelfRecordIntoBuilder(res.records[0]);
      }
      const parts: string[] = [];
      if (res.importedCount > 0) parts.push(`${res.importedCount} added`);
      if (res.updatedCount > 0) parts.push(`${res.updatedCount} updated`);
      if (res.skippedCount > 0 && parts.length === 0) {
        parts.push(`${res.skippedCount} already up to date`);
      }
      flashBanner(`✓ Zine Shelf synced (${parts.join(', ')})!`);
    } catch {
      flashBanner('⚠ Could not read .zine.json / .zineshelf.json file');
    }
  };

  const handleStoryboardSheetDrop = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;

    const images = arr.filter(
      (f) => f.type.startsWith('image/') && !f.name.toLowerCase().endsWith('.gif')
    );
    const videos = arr.filter((f) => f.type.startsWith('video/'));
    const audios = arr.filter((f) => f.type.startsWith('audio/'));

    // Also route any video/audio dropped alongside the storyboard sheet!
    if (videos[0]) assignLeadVideo(videos[0]);
    if (audios[0]) assignSong(audios[0], audios[0].name);

    // If user dropped 2+ individual images, assign them individually
    if (images.length >= 2) {
      handleBatchFilesDrop(arr);
      return;
    }

    // If user dropped 1 Master 2x2 Storyboard Sheet, auto-slice into all 4 shots!
    const sheet = images[0];
    if (!sheet) {
      if (videos[0] || audios[0]) {
        playZineResonanceChime();
        flashBanner('✓ Loaded video/audio into your Zine!');
      }
      return;
    }

    setIsSlicingSheet(true);
    try {
      playZineResonanceChime();
      flashBanner('✂️ Auto-slicing 2×2 Storyboard into all 4 story shots...');
      const [b0, b1, b2, b3] = await slice2x2StoryboardInto4Shots(sheet);
      setShotBlobs([b0, b1, b2, b3]);
      setShotUrls((prev) => {
        prev.forEach((u) => u && URL.revokeObjectURL(u));
        return [
          URL.createObjectURL(b0),
          URL.createObjectURL(b1),
          URL.createObjectURL(b2),
          URL.createObjectURL(b3),
        ];
      });
      flashBanner('✓ Sliced all 4 distinct story shots (Act I → Villain → Clash → Aftermath)!');
    } catch {
      // Fallback: put image in Shot 01 if slicing failed
      assignShotSlot(0, sheet);
      flashBanner('✓ Loaded image into Shot 01!');
    } finally {
      setIsSlicingSheet(false);
    }
  };

  const handleStep2GifsDrop = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(
      (f) => f.type === 'image/gif' || f.type.startsWith('video/') || f.name.toLowerCase().endsWith('.gif')
    );
    if (!arr.length) return;
    playZineResonanceChime();
    if (arr.length >= 2) {
      assignGif1(arr[0], arr[0].name);
      assignGif2(arr[1], arr[1].name);
      flashBanner('✓ Loaded both GIF #1 (Act I) and GIF #2 (Act III)!');
    } else if (!gif1Url) {
      assignGif1(arr[0], arr[0].name);
      flashBanner('✓ Loaded Story GIF #1 (Act I)!');
    } else {
      assignGif2(arr[0], arr[0].name);
      flashBanner('✓ Loaded Story GIF #2 (Act III)!');
    }
  };

  const handleAutoComposeSoundtrack = async (cycleNext: boolean = false) => {
    if (isComposingAudio) return;
    setIsComposingAudio(true);
    playZineBlip(860);
    const nextIdx = cycleNext
      ? (synthStyleIdx + 1) % SYNTH_STYLE_PRESETS.length
      : synthStyleIdx;
    setSynthStyleIdx(nextIdx);
    const nextPreset = SYNTH_STYLE_PRESETS[nextIdx];
    try {
      flashBanner(`🎹 Composing ${nextPreset.label} (${nextPreset.bpm} BPM)...`);
      const seedKey = `${encounter.entity_name}|${encounter.location}|${encounter.theme_set_badge}`;
      const { blob, title } = await render199x3ActSynthTrackWav(seedKey, nextIdx);
      assignSong(blob, title);
      playZineResonanceChime();
      flashBanner(`✓ Playing ${title}`);
    } catch {
      flashBanner('⚠ Could not synthesize soundtrack in this browser');
    } finally {
      setIsComposingAudio(false);
    }
  };

  const handleLoadShelfRecordIntoBuilder = (rec: ZineShelfRecord) => {
    playZineBlip(860);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (outroVideoUrl) URL.revokeObjectURL(outroVideoUrl);
    shotUrls.forEach((u) => u && URL.revokeObjectURL(u));
    if (gif1Url) URL.revokeObjectURL(gif1Url.split('#')[0]);
    if (gif2Url) URL.revokeObjectURL(gif2Url.split('#')[0]);
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    // Sync encounter back to App WITHOUT triggering the new-roll reset effect!
    prevEncounterRef.current = rec.encounter;
    skipNextAutoSaveRef.current = true;
    editingRecordIdRef.current = rec.id;
    onLoadShelfEncounter?.(rec.encounter);

    setEditingRecordId(rec.id);
    setIssueNumber(rec.issueNumber);
    setZinePaletteId(rec.zinePaletteId);
    setActs(rec.acts);
    setAudioTitle(rec.audioTitle || '199X Synthwave Tape');

    setVideoBlob(rec.videoBlob);
    setVideoUrl(rec.videoBlob ? URL.createObjectURL(rec.videoBlob) : undefined);
    setOutroVideoBlob(rec.outroVideoBlob);
    setOutroVideoUrl(
      rec.outroVideoBlob ? URL.createObjectURL(rec.outroVideoBlob) : undefined
    );

    const nextBlobs = [
      rec.shotBlobs?.[0],
      rec.shotBlobs?.[1],
      rec.shotBlobs?.[2],
      rec.shotBlobs?.[3],
    ];
    setShotBlobs(nextBlobs);
    setShotUrls(nextBlobs.map((b) => (b ? URL.createObjectURL(b) : undefined)));

    setGif1Blob(rec.gif1Blob);
    setGif1IsVideo(Boolean(rec.gif1IsVideo));
    if (rec.gif1Blob) {
      const raw1 = URL.createObjectURL(rec.gif1Blob);
      setGif1Url(rec.gif1IsVideo ? `${raw1}#video` : raw1);
    } else {
      setGif1Url(undefined);
    }

    setGif2Blob(rec.gif2Blob);
    setGif2IsVideo(Boolean(rec.gif2IsVideo));
    if (rec.gif2Blob) {
      const raw2 = URL.createObjectURL(rec.gif2Blob);
      setGif2Url(rec.gif2IsVideo ? `${raw2}#video` : raw2);
    } else {
      setGif2Url(undefined);
    }

    setAudioBlob(rec.audioBlob);
    setAudioUrl(rec.audioBlob ? URL.createObjectURL(rec.audioBlob) : undefined);

    setSubTab('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadedSlotsCount =
    (videoUrl ? 1 : 0) +
    shotUrls.filter(Boolean).length +
    (gif1Url ? 1 : 0) +
    (gif2Url ? 1 : 0) +
    (audioUrl ? 1 : 0);

  const wordCount =
    (acts.sceneSetup + ' ' + acts.intervention + ' ' + acts.aftermath)
      .trim()
      .split(/\s+/).length;

  const promptButtons = [
    {
      key: 'video',
      label: '🎬 1. Lead Video',
      sub: 'Good Guy vs. Bad Guy (16:9)',
      text: liveIssue.prompts.leadVideo16x9,
      bg: uiTheme.accent3,
      ink: uiTheme.accent3Ink,
    },
    {
      key: 'song',
      label: '🎵 2. Story Audio',
      sub: 'Act I → II → III Soundtrack',
      text: liveIssue.prompts.synthSongPrompt,
      bg: uiTheme.accent4,
      ink: uiTheme.accent4Ink,
    },
    {
      key: 'shot1',
      label: '🌍 3. Image 01 (Act I)',
      sub: 'Hero Arrives in Sector',
      text: liveIssue.prompts.shot01WideArchitecture,
      bg: uiTheme.surfaceElevated,
      ink: uiTheme.ink,
    },
    {
      key: 'gif1',
      label: '🎞️ 4. GIF 01 (Act I)',
      sub: 'Hero vs. Looming Shadow Loop',
      text: liveIssue.prompts.gif01Act1TensionLoop,
      bg: uiTheme.accent2,
      ink: uiTheme.accent2Ink,
    },
    {
      key: 'shot2',
      label: '👾 5. Image 02 (Act II)',
      sub: 'Bad Guy Villain Portrait',
      text: liveIssue.prompts.shot02AnomalyPortrait,
      bg: uiTheme.surfaceElevated,
      ink: uiTheme.ink,
    },
    {
      key: 'shot3',
      label: '⚡ 6. Image 03 (Act II)',
      sub: 'Good Guy vs. Bad Guy Splash',
      text: liveIssue.prompts.shot03LowAngleAction,
      bg: uiTheme.surfaceElevated,
      ink: uiTheme.ink,
    },
    {
      key: 'gif2',
      label: '🎞️ 7. GIF 02 (Act III)',
      sub: 'Act III Aftermath Loop',
      text: liveIssue.prompts.gif02Act3AftermathLoop,
      bg: uiTheme.accent1,
      ink: uiTheme.accent1Ink,
    },
    {
      key: 'shot4',
      label: '🌅 8. Image 04 (Act III)',
      sub: 'Aftermath Gear & Foil Card',
      text: liveIssue.prompts.shot04TabletopGearFlatlay,
      bg: uiTheme.surfaceElevated,
      ink: uiTheme.ink,
    },
  ];

  const handleInlineSlotDrop = (slot: ZineMediaSlotKey, file: File) => {
    playZineResonanceChime();
    if (slot === 'video') assignLeadVideo(file);
    else if (slot === 'outroVideo') assignOutroVideo(file);
    else if (slot === 'audio') assignSong(file, file.name);
    else if (slot === 'gif1') assignGif1(file, file.name);
    else if (slot === 'gif2') assignGif2(file, file.name);
    else if (slot === 'shot0') assignShotSlot(0, file);
    else if (slot === 'shot1') assignShotSlot(1, file);
    else if (slot === 'shot2') assignShotSlot(2, file);
    else if (slot === 'shot3') assignShotSlot(3, file);
    flashBanner(`✓ Loaded ${file.name} into ${slot.toUpperCase()}!`);
  };

  const handleInlineSlotUploadClick = (slot: ZineMediaSlotKey) => {
    if (slot === 'video') leadVideoInputRef.current?.click();
    else if (slot === 'outroVideo') outroVideoInputRef.current?.click();
    else if (slot === 'audio') songInputRef.current?.click();
    else if (slot === 'gif1') gif1InputRef.current?.click();
    else if (slot === 'gif2') gif2InputRef.current?.click();
    else if (slot === 'shot0') shotInputRefs[0].current?.click();
    else if (slot === 'shot1') shotInputRefs[1].current?.click();
    else if (slot === 'shot2') shotInputRefs[2].current?.click();
    else if (slot === 'shot3') shotInputRefs[3].current?.click();
  };

  return (
    <div className="space-y-6 font-zine-sans" style={{ overflowAnchor: 'none' }}>
      {/* Floating Zero-Layout-Shift Status Toast (never pushes the page up/down!) */}
      {statusBanner && (
        <div
          style={{
            backgroundColor: uiTheme.accent4,
            color: uiTheme.accent4Ink,
            boxShadow: '4px 4px 0px #121212',
          }}
          className="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-2.5 rounded-2xl border-[3px] theme-border font-mono-zine text-xs font-extrabold pointer-events-none"
        >
          {statusBanner}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={batchInputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*,.mp4,.webm,.gif,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleBatchFilesDrop(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={drivePackInputRef}
        type="file"
        multiple
        accept=".json,.zine.json,.zineshelf.json,application/json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleImportDriveFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={storyboardInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.png,.jpg,.jpeg,.webp,.mp4,.mp3,.wav,.m4a"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleStoryboardSheetDrop(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={step2GifsInputRef}
        type="file"
        multiple
        accept="image/gif,video/*,.gif,.mp4,.webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleStep2GifsDrop(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={step3MediaInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,.mp4,.webm,.mov,.mp3,.wav,.m4a,.ogg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleBatchFilesDrop(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={leadVideoInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) assignLeadVideo(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={outroVideoInputRef}
        type="file"
        accept="video/*,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) assignOutroVideo(e.target.files[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={gif1InputRef}
        type="file"
        accept="image/gif,video/*,.gif,.mp4,.webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0])
            assignGif1(e.target.files[0], e.target.files[0].name);
          e.target.value = '';
        }}
      />
      <input
        ref={gif2InputRef}
        type="file"
        accept="image/gif,video/*,.gif,.mp4,.webm"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0])
            assignGif2(e.target.files[0], e.target.files[0].name);
          e.target.value = '';
        }}
      />
      <input
        ref={songInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0])
            assignSong(e.target.files[0], e.target.files[0].name);
          e.target.value = '';
        }}
      />
      {[0, 1, 2, 3].map((idx) => (
        <input
          key={idx}
          ref={shotInputRefs[idx]}
          type="file"
          accept="image/*,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) assignShotSlot(idx, e.target.files[0]);
            e.target.value = '';
          }}
        />
      ))}

      {/* ZINE MODE SUB-NAVIGATION BAR */}
      <div
        style={{ backgroundColor: uiTheme.surfaceBg, color: uiTheme.ink }}
        className="pop-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('builder')}
            style={{
              backgroundColor:
                subTab === 'builder'
                  ? uiTheme.accent1
                  : uiTheme.surfaceElevated,
              color: subTab === 'builder' ? uiTheme.accent1Ink : uiTheme.ink,
            }}
            className="pop-btn px-4 py-2 font-display font-extrabold text-xs sm:text-sm uppercase flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Live Zine Issue (#{String(issueNumber).padStart(2, '0')})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('shelf')}
            style={{
              backgroundColor:
                subTab === 'shelf' ? uiTheme.accent2 : uiTheme.surfaceElevated,
              color: subTab === 'shelf' ? uiTheme.accent2Ink : uiTheme.ink,
            }}
            className="pop-btn px-4 py-2 font-display font-extrabold text-xs sm:text-sm uppercase flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Zine Shelf ({shelfRecords.length} Saved)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {folderSyncSupported && (
            <button
              type="button"
              onClick={() => void handleConnectOrSyncFolder()}
              disabled={isSyncingFolder}
              style={{
                backgroundColor: syncFolderHandle && !syncFolderNeedsGrant ? '#10B981' : uiTheme.accent2,
                color: syncFolderHandle && !syncFolderNeedsGrant ? '#04130D' : uiTheme.accent2Ink,
              }}
              className="pop-btn px-3 py-2 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
              title={
                syncFolderHandle
                  ? `Sync Zine Shelf with shared folder "${syncFolderHandle.name}"`
                  : 'Connect one shared folder (e.g. Google Drive / Documents) so Chrome & Antigravity stay in sync automatically'
              }
            >
              {isSyncingFolder ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderSync className="w-3.5 h-3.5" />
              )}
              <span>
                {syncFolderHandle
                  ? syncFolderNeedsGrant
                    ? `Sync "${syncFolderHandle.name}"`
                    : `✓ "${syncFolderHandle.name}"`
                  : 'Sync Folder'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => void handleExportForDrive()}
            style={{
              backgroundColor: uiTheme.accent3,
              color: uiTheme.accent3Ink,
            }}
            className="pop-btn px-3.5 py-2 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            title="Download portable .zine.json pack (with all 8 media files) to put in Google Drive and open on mobile"
          >
            <Download className="w-4 h-4" />
            <span>Save for Drive</span>
          </button>

          <button
            type="button"
            onClick={() => drivePackInputRef.current?.click()}
            style={{
              backgroundColor: uiTheme.surfaceElevated,
              color: uiTheme.ink,
            }}
            className="pop-btn px-3.5 py-2 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            title="Open a .zine.json file directly from Google Drive or Files"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Drive Zine</span>
          </button>

          <button
            type="button"
            onClick={onOpenPocketReader}
            style={{
              backgroundColor: uiTheme.surfaceElevated,
              color: uiTheme.ink,
            }}
            className="pop-btn px-3.5 py-2 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
            title="Preview Mobile Read-Only Pocket Zine Reader"
          >
            <Smartphone className="w-4 h-4" />
            <span>Pocket Reader</span>
          </button>

          <button
            type="button"
            onClick={handleSaveIssueToShelf}
            disabled={isSavingShelf}
            style={{
              backgroundColor: uiTheme.accent4,
              color: uiTheme.accent4Ink,
            }}
            className="pop-btn px-4 py-2 min-w-[168px] font-display font-extrabold text-xs sm:text-sm uppercase flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>
              {isSavingShelf
                ? 'Saving...'
                : editingRecordId
                ? '✓ Saved (Update)'
                : 'Save to Shelf'}
            </span>
          </button>
        </div>
      </div>

      {subTab === 'shelf' ? (
        /* ==================== ZINE SHELF COVER RACK ==================== */
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setIsShelfDragOver(true);
          }}
          onDragLeave={() => setIsShelfDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsShelfDragOver(false);
            if (e.dataTransfer.files?.length) {
              void handleImportDriveFiles(e.dataTransfer.files);
            }
          }}
          style={{
            backgroundColor: uiTheme.middleBg,
            color: uiTheme.ink,
            outline: isShelfDragOver ? `4px dashed ${uiTheme.accent1}` : undefined,
          }}
          className="pop-card p-5 sm:p-8 space-y-6 transition-all"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase">
                📚 199X Zine Shelf Archive
              </h2>
              <p
                style={{ color: uiTheme.mutedInk }}
                className="text-xs sm:text-sm font-semibold mt-1"
              >
                Click any saved cover to open it, or connect one shared Mac / Google Drive folder so Chrome &amp; Antigravity share the exact same shelf automatically.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSubTab('builder')}
                style={{
                  backgroundColor: uiTheme.accent1,
                  color: uiTheme.accent1Ink,
                }}
                className="pop-btn px-4 py-2 font-mono-zine text-xs font-bold uppercase cursor-pointer"
              >
                ← Back to Live Issue Builder
              </button>
            </div>
          </div>

          {/* SHARED FOLDER AUTO-SYNC + WHOLE-SHELF BACKUP BAR */}
          <div
            style={{ backgroundColor: uiTheme.surfaceBg }}
            className="pop-card p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {folderSyncSupported && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleConnectOrSyncFolder()}
                      disabled={isSyncingFolder}
                      style={{
                        backgroundColor:
                          syncFolderHandle && !syncFolderNeedsGrant
                            ? '#10B981'
                            : uiTheme.accent2,
                        color:
                          syncFolderHandle && !syncFolderNeedsGrant
                            ? '#04130D'
                            : uiTheme.accent2Ink,
                      }}
                      className="pop-btn px-3.5 py-2 font-display font-extrabold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSyncingFolder ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FolderSync className="w-4 h-4" />
                      )}
                      <span>
                        {syncFolderHandle
                          ? syncFolderNeedsGrant
                            ? `Authorize & Sync "${syncFolderHandle.name}"`
                            : `Sync Folder Now ("${syncFolderHandle.name}")`
                          : 'Connect Shared Sync Folder (Chrome ↔ Antigravity)'}
                      </span>
                    </button>

                    {syncFolderHandle && (
                      <button
                        type="button"
                        onClick={() => void handleDisconnectSyncFolder()}
                        style={{
                          backgroundColor: uiTheme.surfaceElevated,
                          color: uiTheme.mutedInk,
                        }}
                        className="pop-btn p-2 cursor-pointer"
                        title="Disconnect shared sync folder"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => void handleExportWholeShelf()}
                  disabled={isExportingShelf || shelfRecords.length === 0}
                  style={{
                    backgroundColor: uiTheme.accent4,
                    color: uiTheme.accent4Ink,
                  }}
                  className="pop-btn px-3.5 py-2 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Download EVERY saved Zine on your Shelf in one .zineshelf.json file (great for Google Drive & phone!)"
                >
                  <Package className="w-4 h-4" />
                  <span>
                    {isExportingShelf
                      ? 'Packing Shelf...'
                      : `Export Whole Shelf (${shelfRecords.length})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => drivePackInputRef.current?.click()}
                  style={{
                    backgroundColor: uiTheme.accent3,
                    color: uiTheme.accent3Ink,
                  }}
                  className="pop-btn px-3.5 py-2 font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                  title="Import one or multiple .zine.json files OR a .zineshelf.json whole-shelf bundle"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Import Zine(s) / Shelf</span>
                </button>
              </div>

              {lastSyncNote && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono-zine text-[11px] font-bold">
                  ✓ {lastSyncNote}
                </span>
              )}
            </div>

            <p
              style={{ color: uiTheme.mutedInk }}
              className="font-mono-zine text-[11px] leading-relaxed"
            >
              {syncFolderHandle ? (
                <>
                  🔗 Linked to <strong>{syncFolderHandle.name}</strong> — every Zine you save writes straight into that folder and auto-pulls whenever you switch back to this tab. Pick the same folder in Chrome &amp; Antigravity for instant 2-way sync!
                </>
              ) : (
                <>
                  💡 <strong>Tip:</strong> Click <strong>Connect Shared Sync Folder</strong> in both Chrome and Antigravity and pick the <strong>same folder</strong> (e.g. a <code>199X-Zines</code> folder inside Google Drive or Documents) — all zines sync automatically in both directions! You can also drag &amp; drop <code>.zine.json</code> or <code>.zineshelf.json</code> files right onto this shelf.
                </>
              )}
            </p>
          </div>

          {shelfRecords.length === 0 ? (
            <div
              style={{ backgroundColor: uiTheme.surfaceBg }}
              className="pop-card p-10 text-center space-y-3"
            >
              <BookOpen className="w-10 h-10 mx-auto opacity-60" />
              <div className="font-display text-xl font-extrabold uppercase">
                No Saved Zine Issues Yet
              </div>
              <p
                style={{ color: uiTheme.mutedInk }}
                className="text-xs sm:text-sm max-w-md mx-auto"
              >
                Assemble your current 199X encounter in the Live Zine Builder and click &ldquo;Save Issue to Zine Shelf&rdquo; to build your magazine rack!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {shelfRecords.map((rec, idx) => {
                const hydrated = hydratedShelfIssues[idx];
                const pal = getZinePalette(rec.zinePaletteId);
                const coverUrl =
                  hydrated?.galleryUrls?.[1] ||
                  hydrated?.galleryUrls?.[0] ||
                  hydrated?.cardImageUrl;
                const shotsLoaded = (rec.shotBlobs || []).filter(Boolean).length;

                return (
                  <div
                    key={rec.id}
                    style={{
                      backgroundColor: uiTheme.surfaceBg,
                      color: uiTheme.ink,
                    }}
                    className="pop-card pop-card-lift overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div
                        style={{
                          backgroundColor: uiTheme.isDark
                            ? uiTheme.accent1
                            : pal.heroYellow,
                          color: uiTheme.isDark
                            ? uiTheme.accent1Ink
                            : '#121212',
                        }}
                        className="px-4 py-2 border-b-[3px] theme-border flex items-center justify-between font-mono-zine text-xs font-bold uppercase"
                      >
                        <span>
                          ISSUE #{String(rec.issueNumber).padStart(2, '0')}
                        </span>
                        <span>
                          {rec.encounter.theme_set_badge || 'SERIES 2'}
                        </span>
                      </div>

                      <div
                        onClick={() => handleLoadShelfRecordIntoBuilder(rec)}
                        className="relative aspect-[16/10] bg-[#121212] border-b-[3px] theme-border overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={rec.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        ) : hydrated?.videoUrl ? (
                          <video
                            src={hydrated.videoUrl}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="p-6 text-center text-white font-display font-extrabold uppercase">
                            {rec.title}
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                          {rec.videoBlob && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-black border border-black font-mono-zine text-[10px] font-bold">
                              🎬 VID
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-yellow-300 text-black border border-black font-mono-zine text-[10px] font-bold">
                            📸 {shotsLoaded}/4
                          </span>
                          {(rec.gif1Blob || rec.gif2Blob) && (
                            <span className="px-2 py-0.5 rounded-full bg-lime-400 text-black border border-black font-mono-zine text-[10px] font-bold">
                              🎞️ {(rec.gif1Blob ? 1 : 0) + (rec.gif2Blob ? 1 : 0)} GIF
                            </span>
                          )}
                          {rec.audioBlob && (
                            <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white border border-black font-mono-zine text-[10px] font-bold">
                              🎵 SONG
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <h3 className="font-display text-xl font-extrabold uppercase leading-tight">
                          {rec.title}
                        </h3>
                        <p
                          style={{ color: uiTheme.mutedInk }}
                          className="text-xs font-semibold truncate"
                        >
                          📍 {rec.encounter.location}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadShelfRecordIntoBuilder(rec)}
                        style={{
                          backgroundColor: uiTheme.accent3,
                          color: uiTheme.accent3Ink,
                        }}
                        className="flex-1 pop-btn py-2 font-mono-zine text-xs font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Open Issue
                      </button>

                      {hydrated && (
                        <button
                          type="button"
                          onClick={() =>
                            void exportZineIssueForDrive(hydrated, {
                              videoBlob: rec.videoBlob,
                              outroVideoBlob: rec.outroVideoBlob,
                              shotBlobs: rec.shotBlobs,
                              gif1Blob: rec.gif1Blob,
                              gif1IsVideo: rec.gif1IsVideo,
                              gif2Blob: rec.gif2Blob,
                              gif2IsVideo: rec.gif2IsVideo,
                              audioBlob: rec.audioBlob,
                            })
                          }
                          style={{
                            backgroundColor: uiTheme.accent1,
                            color: uiTheme.accent1Ink,
                          }}
                          className="pop-btn px-2.5 py-2 font-mono-zine text-[10px] font-bold uppercase cursor-pointer"
                          title="Export portable .zine.json pack for Google Drive / mobile"
                        >
                          Drive
                        </button>
                      )}

                      {hydrated && (
                        <button
                          type="button"
                          onClick={() =>
                            exportStandaloneZineHtml(hydrated, undefined, uiTheme)
                          }
                          style={{
                            backgroundColor: uiTheme.accent4,
                            color: uiTheme.accent4Ink,
                          }}
                          className="pop-btn p-2 cursor-pointer"
                          title="Download Standalone .HTML Zine"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          await deleteZineShelfIssue(rec.id);
                          await removeRecordFromConnectedFolder(rec.id);
                          if (editingRecordId === rec.id) {
                            editingRecordIdRef.current = undefined;
                            setEditingRecordId(undefined);
                          }
                          await onRefreshShelf();
                        }}
                        style={{
                          backgroundColor: uiTheme.surfaceElevated,
                          color: '#EF4444',
                        }}
                        className="pop-btn p-2 cursor-pointer"
                        title="Delete Issue from Shelf"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* ==================== LIVE ZINE BUILDER + FULL NEO-POP ZINE VIEW ==================== */
        <>
          {/* STREAMLINED 3-STEP COHESIVE ZINE DIRECTOR (1 GEMINI TAB • ZERO TAB JUGGLING!) */}
          <section
            style={{ backgroundColor: uiTheme.middleBg, color: uiTheme.ink }}
            className="pop-card p-4 sm:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono-zine text-[11px] font-bold uppercase opacity-75">
                  3-STEP COHESIVE ZINE DIRECTOR • 1 GEMINI TAB, 100% MATCHED HERO &amp; STORY PROGRESSION
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase">
                  Build Your Complete Zine in 3 Easy Steps
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced8((v) => !v)}
                style={{
                  backgroundColor: uiTheme.surfaceElevated,
                  color: uiTheme.ink,
                }}
                className="px-3 py-1.5 rounded-xl border-2 theme-border font-mono-zine text-[11px] font-bold uppercase cursor-pointer"
              >
                {showAdvanced8
                  ? '✕ Hide Individual 8 Slots'
                  : `🔧 Individual 8 Prompts & Slots (${loadedSlotsCount}/8)`}
              </button>
            </div>

            {/* 3 CLEAN STEP CARDS (Story is already written on Roll!) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {/* STEP 1: 1 MASTER 2x2 STORYBOARD IMAGE -> AUTO-SLICES ALL 4 DISTINCT SHOTS */}
              <div
                style={{ backgroundColor: uiTheme.surfaceBg }}
                className="p-4 rounded-2xl border-[3px] theme-border flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{
                        backgroundColor: uiTheme.accent1,
                        color: uiTheme.accent1Ink,
                      }}
                      className="px-2.5 py-0.5 rounded-full border-2 theme-border font-mono-zine text-[11px] font-black uppercase"
                    >
                      STEP 1 • 4 STORY IMAGES (1 FILE)
                    </span>
                    <span className="font-mono-zine text-[11px] font-bold">
                      {shotUrls.filter(Boolean).length}/4
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-extrabold uppercase leading-tight">
                    1 Master 2×2 Storyboard Sheet
                  </h4>
                  <p
                    style={{ color: uiTheme.mutedInk }}
                    className="text-xs font-semibold leading-relaxed"
                  >
                    Copy <strong>1 Flow-safe prompt</strong> into Google Flow / Gemini → get <strong>1 cohesive 4-panel image</strong> → drop it here. <em>Tip: click <strong>+</strong> for a fresh Flow chat if an older prompt was flagged.</em>
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyPrompt(
                        'master-2x2',
                        liveIssue.prompts.masterStoryboard2x2Prompt
                      )
                    }
                    style={{
                      backgroundColor:
                        copiedKey === 'master-2x2' ? '#10B981' : uiTheme.accent1,
                      color:
                        copiedKey === 'master-2x2' ? '#04130D' : uiTheme.accent1Ink,
                    }}
                    className="w-full pop-btn px-3.5 py-2.5 font-display font-extrabold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedKey === 'master-2x2' ? (
                      <>
                        <Check className="w-4 h-4" /> Copied! Paste Once in Gemini / Flow
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Master 4-Panel Prompt (Policy-Safe)
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyPrompt(
                        'master-2x2-safe',
                        liveIssue.prompts.masterStoryboardUltraSafePrompt
                      )
                    }
                    style={{
                      backgroundColor:
                        copiedKey === 'master-2x2-safe' ? '#10B981' : uiTheme.inputBg,
                      color:
                        copiedKey === 'master-2x2-safe' ? '#04130D' : uiTheme.ink,
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border-2 theme-border font-mono-zine font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-105 transition-all"
                  >
                    {copiedKey === 'master-2x2-safe' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied Ultra-Safe Backup Prompt!
                      </>
                    ) : (
                      <>
                        <span>🛡️ Blocked in Flow? Copy Ultra-Safe 4-Panel Backup</span>
                      </>
                    )}
                  </button>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsSheetDragOver(true);
                    }}
                    onDragLeave={() => setIsSheetDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsSheetDragOver(false);
                      if (e.dataTransfer.files?.length) {
                        void handleStoryboardSheetDrop(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => storyboardInputRef.current?.click()}
                    style={{
                      backgroundColor: isSheetDragOver
                        ? uiTheme.tile2
                        : uiTheme.inputBg,
                    }}
                    className="p-3 rounded-xl border-2 border-dashed theme-border cursor-pointer text-center space-y-1 transition-all hover:brightness-105"
                  >
                    <div className="font-mono-zine text-xs font-black uppercase flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>
                        {isSlicingSheet
                          ? '✂️ Slicing 4 Panels...'
                          : shotUrls.filter(Boolean).length === 4
                          ? '✓ All 4 Distinct Shots Loaded!'
                          : 'Drop Your 1 Storyboard Image Here'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-mono-zine opacity-80 whitespace-nowrap overflow-hidden">
                      {['Act I', 'Villain', 'Clash', 'End'].map((lbl, i) => (
                        <span
                          key={lbl}
                          className={`px-1.5 py-0.5 rounded border ${
                            shotUrls[i]
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                              : 'border-current opacity-60'
                          }`}
                        >
                          {shotUrls[i] ? `✓${lbl}` : lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: 2 STORY GIFS (SAME GEMINI CHAT FOLLOW-UPS!) */}
              <div
                style={{ backgroundColor: uiTheme.surfaceBg }}
                className="p-4 rounded-2xl border-[3px] theme-border flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{
                        backgroundColor: uiTheme.accent2,
                        color: uiTheme.accent2Ink,
                      }}
                      className="px-2.5 py-0.5 rounded-full border-2 theme-border font-mono-zine text-[11px] font-black uppercase"
                    >
                      STEP 2 • 2 STORY GIFS (SAME CHAT)
                    </span>
                    <span className="font-mono-zine text-[11px] font-bold">
                      {(gif1Url ? 1 : 0) + (gif2Url ? 1 : 0)}/2
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-extrabold uppercase leading-tight">
                    Act I &amp; Act III Motion Loops
                  </h4>
                  <p
                    style={{ color: uiTheme.mutedInk }}
                    className="text-xs font-semibold leading-relaxed"
                  >
                    Paste right below your storyboard in that <strong>same Gemini chat</strong> so the loops match your exact art style &amp; lighting! (Optional — never repeats still shots.)
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(
                          'same-chat-gif1',
                          liveIssue.prompts.sameChatGif1FollowupPrompt
                        )
                      }
                      style={{
                        backgroundColor:
                          copiedKey === 'same-chat-gif1'
                            ? '#10B981'
                            : uiTheme.accent2,
                        color:
                          copiedKey === 'same-chat-gif1'
                            ? '#04130D'
                            : uiTheme.accent2Ink,
                      }}
                      className="pop-btn px-2.5 py-2.5 font-mono-zine text-[11px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'same-chat-gif1' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> GIF #1 (Act I)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(
                          'same-chat-gif2',
                          liveIssue.prompts.sameChatGif2FollowupPrompt
                        )
                      }
                      style={{
                        backgroundColor:
                          copiedKey === 'same-chat-gif2'
                            ? '#10B981'
                            : uiTheme.accent3,
                        color:
                          copiedKey === 'same-chat-gif2'
                            ? '#04130D'
                            : uiTheme.accent3Ink,
                      }}
                      className="pop-btn px-2.5 py-2.5 font-mono-zine text-[11px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'same-chat-gif2' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> GIF #2 (Act III)
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsStep2GifDragOver(true);
                    }}
                    onDragLeave={() => setIsStep2GifDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsStep2GifDragOver(false);
                      if (e.dataTransfer.files?.length) {
                        handleStep2GifsDrop(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => step2GifsInputRef.current?.click()}
                    style={{
                      backgroundColor: isStep2GifDragOver
                        ? uiTheme.tile2
                        : uiTheme.inputBg,
                    }}
                    className="p-3 rounded-xl border-2 border-dashed theme-border cursor-pointer text-center space-y-1 transition-all hover:brightness-105"
                  >
                    <div className="font-mono-zine text-xs font-black uppercase flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Drop GIF #1 &amp; GIF #2 (.gif / .mp4)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-mono-zine">
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          gif1Url
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                            : 'border-current opacity-60'
                        }`}
                      >
                        {gif1Url ? '✓ GIF #1 Act I' : 'GIF #1 Act I'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border ${
                          gif2Url
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                            : 'border-current opacity-60'
                        }`}
                      >
                        {gif2Url ? '✓ GIF #2 Act III' : 'GIF #2 Act III'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: AUDIO (5 BUILT-IN STYLES OR PROMPT) + LEAD VIDEO */}
              <div
                style={{ backgroundColor: uiTheme.surfaceBg }}
                className="p-4 rounded-2xl border-[3px] theme-border flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{
                        backgroundColor: uiTheme.accent4,
                        color: uiTheme.accent4Ink,
                      }}
                      className="px-2.5 py-0.5 rounded-full border-2 theme-border font-mono-zine text-[11px] font-black uppercase"
                    >
                      STEP 3 • AUDIO &amp; LEAD VIDEO
                    </span>
                    <span className="font-mono-zine text-[11px] font-bold">
                      {audioUrl ? '🎵✓' : '🎵'} {videoUrl ? '🎬✓' : '🎬'}
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-extrabold uppercase leading-tight">
                    5-Style Synth Audio + Hero Video
                  </h4>
                  <p
                    style={{ color: uiTheme.mutedInk }}
                    className="text-xs font-semibold leading-relaxed"
                  >
                    Try all <strong>5 built-in 1990s styles</strong> (zero tabs!) or copy the audio/video prompts for that same Gemini chat!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAutoComposeSoundtrack(Boolean(audioUrl))}
                      disabled={isComposingAudio}
                      style={{
                        backgroundColor: audioUrl ? '#10B981' : uiTheme.accent4,
                        color: audioUrl ? '#04130D' : uiTheme.accent4Ink,
                      }}
                      className="flex-1 pop-btn px-3 py-2.5 font-display font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Music className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {isComposingAudio
                          ? 'Rendering...'
                          : audioUrl
                          ? `🎲 Next Style (${SYNTH_STYLE_PRESETS[(synthStyleIdx + 1) % SYNTH_STYLE_PRESETS.length].label.split(' ')[0]})`
                          : '🎵 Auto-Compose 199X Track'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt('song-prompt', liveIssue.prompts.synthSongPrompt)
                      }
                      style={{
                        backgroundColor:
                          copiedKey === 'song-prompt'
                            ? '#10B981'
                            : uiTheme.surfaceElevated,
                        color:
                          copiedKey === 'song-prompt' ? '#04130D' : uiTheme.ink,
                      }}
                      className="px-2.5 py-2 rounded-xl border-2 theme-border font-mono-zine text-[10px] font-bold uppercase shrink-0 cursor-pointer"
                      title="Copy text prompt if you prefer generating audio externally"
                    >
                      {copiedKey === 'song-prompt' ? '✓' : 'Prompt'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(
                          'same-chat-vid',
                          liveIssue.prompts.sameChatVideoFollowupPrompt
                        )
                      }
                      style={{
                        backgroundColor:
                          copiedKey === 'same-chat-vid'
                            ? '#10B981'
                            : uiTheme.accent3,
                        color:
                          copiedKey === 'same-chat-vid'
                            ? '#04130D'
                            : uiTheme.accent3Ink,
                      }}
                      className="pop-btn px-2 py-2 font-mono-zine text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                      title="8-second Act II Good Guy vs. Bad Guy Showdown video (paste in same Gemini chat)"
                    >
                      {copiedKey === 'same-chat-vid' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5" /> Video 1 (Clash)
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPrompt(
                          'same-chat-outro',
                          liveIssue.prompts.sameChatOutroVideoPrompt
                        )
                      }
                      style={{
                        backgroundColor:
                          copiedKey === 'same-chat-outro'
                            ? '#10B981'
                            : uiTheme.accent2,
                        color:
                          copiedKey === 'same-chat-outro'
                            ? '#04130D'
                            : uiTheme.accent2Ink,
                      }}
                      className="pop-btn px-2 py-2 font-mono-zine text-[10px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer"
                      title="8-second Act III Finale Ending video where anomaly crystallizes into the 3 Holo Cards (paste in same Gemini chat)"
                    >
                      {copiedKey === 'same-chat-outro' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Film className="w-3.5 h-3.5" /> Video 2 (Ending)
                        </>
                      )}
                    </button>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsStep3DragOver(true);
                    }}
                    onDragLeave={() => setIsStep3DragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsStep3DragOver(false);
                      if (e.dataTransfer.files?.length) {
                        handleBatchFilesDrop(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => step3MediaInputRef.current?.click()}
                    style={{
                      backgroundColor: isStep3DragOver
                        ? uiTheme.tile2
                        : uiTheme.inputBg,
                    }}
                    className="p-2.5 rounded-xl border-2 border-dashed theme-border cursor-pointer font-mono-zine text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 whitespace-nowrap overflow-hidden hover:brightness-105"
                    title="Drop Video 1 (.mp4), Finale Video 2 (.mp4), or custom .mp3 here"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>Drop MP4 / MP3</span>
                    <span className={videoUrl ? 'text-emerald-400' : 'opacity-60'}>
                      {videoUrl ? '✓V1' : 'V1'}
                    </span>
                    <span className={outroVideoUrl ? 'text-emerald-400' : 'opacity-60'}>
                      {outroVideoUrl ? '✓V2' : 'V2'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Paste Story Box */}
            {showStoryPasteBox && (
              <div
                style={{ backgroundColor: uiTheme.surfaceBg }}
                className="p-3 rounded-2xl border-2 theme-border space-y-2"
              >
                <textarea
                  value={storyPasteText}
                  onChange={(e) => setStoryPasteText(e.target.value)}
                  rows={4}
                  placeholder="Paste a 3-Act story here (with ACT 01 / ACT 02 / ACT 03 headers or multiple paragraphs)..."
                  style={{
                    backgroundColor: uiTheme.inputBg,
                    color: uiTheme.ink,
                  }}
                  className="w-full p-2.5 rounded-xl border-2 theme-border text-xs font-mono-zine"
                />
                <button
                  type="button"
                  onClick={handleApplyPastedStory}
                  style={{
                    backgroundColor: uiTheme.accent4,
                    color: uiTheme.accent4Ink,
                  }}
                  className="pop-btn px-4 py-1.5 font-mono-zine text-xs font-bold uppercase cursor-pointer"
                >
                  Apply Pasted Story to Spreads
                </button>
              </div>
            )}

            {/* OPTIONAL COLLAPSED ADVANCED 8-PROMPT & 8-SLOT DRAWER */}
            {showAdvanced8 && (
              <div className="pt-4 border-t-2 theme-border grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono-zine text-xs font-bold uppercase opacity-80">
                      ADVANCED • INDIVIDUAL 8 PROMPTS
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyAll8Prompts}
                        style={{
                          backgroundColor: uiTheme.accent1,
                          color: uiTheme.accent1Ink,
                        }}
                        className="pop-btn px-3 py-1 font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'all-8' ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Copied All 8!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy All 8
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPromptInspector((v) => !v)}
                        style={{
                          backgroundColor: uiTheme.surfaceElevated,
                          color: uiTheme.ink,
                        }}
                        className="px-2.5 py-1 rounded-xl border-2 theme-border font-mono-zine text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showPromptInspector ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Hide Text
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Peek Prompts
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {promptButtons.map((pb) => {
                      const isCopied = copiedKey === pb.key;
                      return (
                        <button
                          key={pb.key}
                          type="button"
                          onClick={() => handleCopyPrompt(pb.key, pb.text)}
                          style={{
                            backgroundColor: isCopied ? '#10B981' : pb.bg,
                            color: isCopied ? '#04130D' : pb.ink,
                          }}
                          className="pop-btn p-2 text-left flex flex-col justify-between gap-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="font-mono-zine text-[10px] font-bold uppercase truncate">
                              {isCopied ? '✓ Copied!' : pb.label}
                            </span>
                            {isCopied ? (
                              <Check className="w-3 h-3 shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 shrink-0 opacity-75" />
                            )}
                          </div>
                          <span className="text-[10px] font-semibold opacity-80 truncate block w-full">
                            {pb.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {showPromptInspector && (
                    <div
                      style={{
                        backgroundColor: uiTheme.inputBg,
                        color: uiTheme.ink,
                      }}
                      className="p-3 rounded-2xl border-2 theme-border max-h-56 overflow-y-auto space-y-2 text-xs font-mono-zine"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold uppercase opacity-80">
                          ★ MASTER 2x2 STORYBOARD PROMPT:
                        </div>
                        <p className="opacity-90 select-all leading-relaxed whitespace-pre-wrap">
                          {liveIssue.prompts.masterStoryboard2x2Prompt}
                        </p>
                      </div>
                      {promptButtons.map((pb) => (
                        <div key={pb.key} className="space-y-0.5">
                          <div className="font-bold uppercase opacity-80">
                            {pb.label}:
                          </div>
                          <p className="opacity-90 select-all leading-relaxed">
                            {pb.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="xl:col-span-5 space-y-2.5">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files?.length) {
                        handleBatchFilesDrop(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => batchInputRef.current?.click()}
                    style={{
                      backgroundColor: isDragOver
                        ? uiTheme.tile2
                        : uiTheme.surfaceBg,
                    }}
                    className="p-3 rounded-xl border-2 border-dashed theme-border cursor-pointer text-center text-xs font-mono-zine font-bold"
                  >
                    Drop Multiple Individual Files Here ({loadedSlotsCount}/8)
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-zine">
                    <div
                      style={{ backgroundColor: uiTheme.surfaceElevated }}
                      className="p-2 rounded-xl border-2 theme-border flex items-center justify-between gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => leadVideoInputRef.current?.click()}
                        className="truncate font-bold text-left flex-1 cursor-pointer"
                      >
                        🎬 {videoUrl ? '✓ Video' : '+ Video'}
                      </button>
                      {videoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(videoUrl);
                            setVideoBlob(undefined);
                            setVideoUrl(undefined);
                          }}
                          className="text-red-500 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div
                      style={{ backgroundColor: uiTheme.surfaceElevated }}
                      className="p-2 rounded-xl border-2 theme-border flex items-center justify-between gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => gif1InputRef.current?.click()}
                        className="truncate font-bold text-left flex-1 cursor-pointer"
                      >
                        🎞️ {gif1Url ? '✓ GIF #1' : '+ GIF #1'}
                      </button>
                      {gif1Url && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(gif1Url.split('#')[0]);
                            setGif1Blob(undefined);
                            setGif1Url(undefined);
                          }}
                          className="text-red-500 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div
                      style={{ backgroundColor: uiTheme.surfaceElevated }}
                      className="p-2 rounded-xl border-2 theme-border flex items-center justify-between gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => gif2InputRef.current?.click()}
                        className="truncate font-bold text-left flex-1 cursor-pointer"
                      >
                        🎞️ {gif2Url ? '✓ GIF #2' : '+ GIF #2'}
                      </button>
                      {gif2Url && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(gif2Url.split('#')[0]);
                            setGif2Blob(undefined);
                            setGif2Url(undefined);
                          }}
                          className="text-red-500 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div
                      style={{ backgroundColor: uiTheme.surfaceElevated }}
                      className="p-2 rounded-xl border-2 theme-border flex items-center justify-between gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => songInputRef.current?.click()}
                        className="truncate font-bold text-left flex-1 cursor-pointer"
                      >
                        🎵 {audioUrl ? '✓ Song' : '+ Song'}
                      </button>
                      {audioUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(audioUrl);
                            setAudioBlob(undefined);
                            setAudioUrl(undefined);
                          }}
                          className="text-red-500 font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {[0, 1, 2, 3].map((sIdx) => (
                      <div
                        key={sIdx}
                        style={{ backgroundColor: uiTheme.surfaceElevated }}
                        className="p-2 rounded-xl border-2 theme-border flex items-center justify-between gap-1"
                      >
                        <button
                          type="button"
                          onClick={() => shotInputRefs[sIdx].current?.click()}
                          className="truncate font-bold text-left flex-1 cursor-pointer"
                        >
                          📸 {shotUrls[sIdx] ? `✓ Shot 0${sIdx + 1}` : `+ Shot 0${sIdx + 1}`}
                        </button>
                        {shotUrls[sIdx] && (
                          <button
                            type="button"
                            onClick={() => assignShotSlot(sIdx, undefined)}
                            className="text-red-500 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* LIVE INTERACTIVE NEO-POP MAGAZINE ZINE */}
          <ZineIssueView
            issue={liveIssue}
            onUpdatePalette={(pid) => setZinePaletteId(pid)}
            onDropSlotFile={handleInlineSlotDrop}
            onClickUploadSlot={handleInlineSlotUploadClick}
            onSaveToShelf={handleSaveIssueToShelf}
            isSavingShelf={isSavingShelf}
            isSavedOnShelf={Boolean(editingRecordId)}
            onExportForDrive={handleExportForDrive}
            onAiRewriteStory={handleAiRemixStory}
            isAiRewriting={isAiExpanding}
            uiTheme={uiTheme}
          />
        </>
      )}
    </div>
  );
};
