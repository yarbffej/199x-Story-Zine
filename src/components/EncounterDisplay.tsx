import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderArchive,
  Image as ImageIcon,
  Film,
  Volume2,
  VolumeX,
  Trash2,
  Eye,
  EyeOff,
  Dices,
  Copy,
  Check,
  Plus,
  BookOpen
} from 'lucide-react';
import { CombatEncounter } from '../types';
import { StudioUiTheme } from '../data/uiThemes';
import { playAttackTick, playCriticalSmashSound, playSynergyEffect } from '../utils/audio';
import { saveCardToArchive, extractVideoPosterFrame } from '../utils/archiveDb';
import { TradingCardVisual } from './TradingCardVisual';
import { getChoreographyPresetsForCard, buildFlowVideoPromptFromPreset } from '../engine/choreography';

interface EncounterDisplayProps {
  encounter: CombatEncounter;
  onSavedToBinder?: (targetTab?: 'cards' | 'videos') => void;
  onOpenZineView?: () => void;
  uiTheme?: StudioUiTheme;
}

export const EncounterDisplay: React.FC<EncounterDisplayProps> = ({
  encounter,
  onSavedToBinder,
  onOpenZineView,
  uiTheme,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedVideoPrompt, setCopiedVideoPrompt] = useState<boolean>(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [useAiDirectorPrompt, setUseAiDirectorPrompt] = useState<boolean>(true);
  const [copiedImageToClipboard, setCopiedImageToClipboard] = useState<boolean>(false);
  const [showPromptPreview, setShowPromptPreview] = useState<boolean>(false);
  const [pastedFeedback, setPastedFeedback] = useState<string | null>(null);

  // Staged media state
  const [artworkBlob, setArtworkBlob] = useState<Blob | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string>('');
  const [artworkName, setArtworkName] = useState<string>('');
  const [isPosterExtracted, setIsPosterExtracted] = useState<boolean>(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
  const [isExtractingFrame, setIsExtractingFrame] = useState<boolean>(false);
  const [isSavingToBinder, setIsSavingToBinder] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const singleImageInputRef = useRef<HTMLInputElement>(null);
  const singleVideoInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (artworkUrl) URL.revokeObjectURL(artworkUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [artworkUrl, videoUrl]);

  useEffect(() => {
    if (artworkUrl) URL.revokeObjectURL(artworkUrl);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setArtworkBlob(null);
    setArtworkUrl('');
    setArtworkName('');
    setIsPosterExtracted(false);
    setVideoBlob(null);
    setVideoUrl('');
    setVideoName('');
    setPastedFeedback(null);
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    if (singleImageInputRef.current) singleImageInputRef.current.value = '';
    if (singleVideoInputRef.current) singleVideoInputRef.current.value = '';

    setSelectedPresetIndex(Math.floor(Math.random() * 6));
    setUseAiDirectorPrompt(Boolean(encounter.flow_video_prompt));

    playAttackTick(0);
    setTimeout(() => {
      if (encounter.critical_smash) playCriticalSmashSound();
      else playSynergyEffect();
    }, 140);
  }, [encounter]);

  const handleIncomingFiles = useCallback(async (files: FileList | File[], sourceName?: string) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    let targetImage: File | null = null;
    let targetVideo: File | null = null;

    for (const file of fileList) {
      const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
      const isImg = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
      if (isVid && !targetVideo) targetVideo = file;
      else if (isImg && !targetImage) targetImage = file;
    }

    if (targetImage) {
      if (artworkUrl) URL.revokeObjectURL(artworkUrl);
      const url = URL.createObjectURL(targetImage);
      setArtworkBlob(targetImage);
      setArtworkUrl(url);
      setArtworkName(targetImage.name || sourceName || 'clipboard-image.png');
      setIsPosterExtracted(false);
      playAttackTick(1);

      if (sourceName) {
        setPastedFeedback('✓ Pasted image from clipboard!');
        setTimeout(() => setPastedFeedback(null), 3000);
      }
    }

    if (targetVideo) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const vUrl = URL.createObjectURL(targetVideo);
      setVideoBlob(targetVideo);
      setVideoUrl(vUrl);
      setVideoName(targetVideo.name);
      playAttackTick(2);

      if (!targetImage && (!artworkBlob || isPosterExtracted)) {
        setIsExtractingFrame(true);
        try {
          const poster = await extractVideoPosterFrame(targetVideo);
          if (artworkUrl) URL.revokeObjectURL(artworkUrl);
          setArtworkBlob(poster);
          setArtworkUrl(URL.createObjectURL(poster));
          setArtworkName(`poster-${targetVideo.name}.png`);
          setIsPosterExtracted(true);
        } catch (err) {
          console.warn('Video poster frame extraction fallback:', err);
        } finally {
          setIsExtractingFrame(false);
        }
      }
    }
  }, [artworkUrl, videoUrl, artworkBlob, isPosterExtracted]);

  // Global window paste listener for Ctrl+V / Cmd+V
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const files: File[] = [];

      if (clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
              files.push(new File([blob], `pasted-art-${Date.now()}.png`, { type: item.type }));
            }
          } else if (item.type.startsWith('video/')) {
            const blob = item.getAsFile();
            if (blob) {
              files.push(new File([blob], `pasted-video-${Date.now()}.mp4`, { type: item.type }));
            }
          }
        }
      }

      if (files.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const f = clipboardData.files[i];
          if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
            files.push(f);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        handleIncomingFiles(files, 'pasted-artwork.png');
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleIncomingFiles]);

  const removeArtwork = () => {
    if (artworkUrl) URL.revokeObjectURL(artworkUrl);
    setArtworkBlob(null);
    setArtworkUrl('');
    setArtworkName('');
    setIsPosterExtracted(false);
    if (singleImageInputRef.current) singleImageInputRef.current.value = '';
  };

  const removeVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl('');
    setVideoName('');
    if (singleVideoInputRef.current) singleVideoInputRef.current.value = '';
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    const next = !isVideoMuted;
    videoRef.current.muted = next;
    setIsVideoMuted(next);
  };

  const handleSaveToBinder = async () => {
    if (!artworkBlob && !videoBlob) return;
    setIsSavingToBinder(true);
    try {
      let finalPosterBlob = artworkBlob;
      if (!finalPosterBlob && videoBlob) {
        finalPosterBlob = await extractVideoPosterFrame(videoBlob);
      }
      if (!finalPosterBlob) return;

      await saveCardToArchive(
        encounter,
        finalPosterBlob,
        artworkName || 'encounter-art.png',
        videoBlob || undefined,
        videoName || undefined,
        videoBlob ? 'video' : 'image'
      );

      if (onSavedToBinder) {
        onSavedToBinder('cards');
      }
    } catch (err) {
      console.error('Failed saving card to archive:', err);
    } finally {
      setIsSavingToBinder(false);
    }
  };

  const charShort = (encounter.entity_name || 'Entity').replace(/['"]/g, '');
  const activeWeapon = encounter.protagonist_loadout?.improvised_weapon || 'improvised gear';
  const activeArtifact = encounter.protagonist_loadout?.nostalgia_artifact || 'retro device';
  const inferredLocation = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';

  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    charShort,
    inferredLocation,
    encounter.card_type || 'bad_guy',
    activeWeapon,
    activeArtifact,
    encounter.featured_character || ''
  );

  const activePreset = presets[selectedPresetIndex % presets.length] || presets[0];

  const computedFlowPrompt = (useAiDirectorPrompt && encounter.flow_video_prompt)
    ? encounter.flow_video_prompt
    : buildFlowVideoPromptFromPreset(encounter, activePreset);

  const handleShuffleAction = () => {
    setUseAiDirectorPrompt(false);
    setSelectedPresetIndex(prev => (prev + 1) % presets.length);
    playAttackTick(1);
  };

  const handleCopyImageBlobToClipboard = async () => {
    if (!artworkBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [artworkBlob.type || 'image/png']: artworkBlob })
      ]);
      setCopiedImageToClipboard(true);
      setTimeout(() => setCopiedImageToClipboard(false), 2500);
    } catch {
      if (artworkUrl) {
        const a = document.createElement('a');
        a.href = artworkUrl;
        a.download = `${encounter.entity_name.replace(/\s+/g, '_')}_flow_input.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setCopiedImageToClipboard(true);
      setTimeout(() => setCopiedImageToClipboard(false), 2500);
    }
  };

  const threatColor = encounter.threat_level_color || "#FF007F";
  const foilRarity = encounter.card_foil_rarity || (encounter.is_foil ? 'silver' : 'standard');

  return (
    <div
      id="combat-encounter-card"
      className="rounded-2xl border-[2.5px] bg-zinc-950/90 overflow-hidden shadow-2xl p-4 sm:p-6 font-mono transition-colors duration-300"
      style={{
        borderColor: uiTheme?.isDark ? uiTheme.borderColor : threatColor,
        backgroundColor: uiTheme?.isDark ? uiTheme.middleBg : undefined,
        backgroundImage: uiTheme?.isDark ? uiTheme.middleBgImage : undefined,
        backgroundSize: uiTheme?.isDark ? uiTheme.middleBgSize : undefined,
      }}
    >
      {/* Hidden File Inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleIncomingFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={singleImageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleIncomingFiles([e.target.files[0]]);
          e.target.value = '';
        }}
      />
      <input
        ref={singleVideoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleIncomingFiles([e.target.files[0]]);
          e.target.value = '';
        }}
      />

      {/* Side-by-Side Card-First Studio */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / CENTER: Live Trading Card (Front & Center) */}
        <div className="xl:col-span-7 2xl:col-span-8">
          <TradingCardVisual
            encounter={encounter}
            imageUrl={artworkUrl}
            videoUrl={videoUrl}
            displaySide="both"
            cardTheme={encounter.card_theme}
            locationName={encounter.location}
            onThemeChange={(newTheme) => {
              encounter.card_theme = newTheme;
            }}
          />
        </div>

        {/* RIGHT: Clean 3-Step Studio Dock */}
        <div className="xl:col-span-5 2xl:col-span-4 space-y-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          {/* Card Identity Header */}
          <div className="space-y-1.5 border-b border-zinc-800 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-black"
                style={{ backgroundColor: threatColor }}
              >
                {foilRarity.toUpperCase()}
              </span>
              {encounter.theme_set_badge && (
                <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500/50 text-[10px] text-purple-200 font-bold uppercase">
                  {encounter.theme_set_badge}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-cyan-300 font-bold">
                {morphology.icon} {morphology.badge}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase leading-tight font-sans">
              {encounter.entity_name}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate">
              📍 {inferredLocation}
            </p>
          </div>

          {/* STEP 1: Copy Prompts (2 Clean Buttons) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-bold text-zinc-200 uppercase">Step 1 • Copy Prompts</span>
              <button
                type="button"
                onClick={() => setShowPromptPreview(!showPromptPreview)}
                className="text-zinc-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                {showPromptPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPromptPreview ? 'Hide Text' : 'Peek'}</span>
              </button>
            </div>

            {/* Button 1: Copy Image Prompt */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(encounter.visual_generation_prompt);
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2200);
                } catch {}
              }}
              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                copiedPrompt
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-700 hover:border-pink-500 text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ImageIcon className="w-4 h-4 text-pink-400 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-black uppercase text-pink-300">
                    {copiedPrompt ? '✓ Copied Image Prompt!' : '1. Copy Image Prompt'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Clean 4:3 art • Zero text
                  </div>
                </div>
              </div>
              {copiedPrompt ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-400 shrink-0" />}
            </button>

            {/* Button 2: Copy 4s Video Prompt + Tiny Shuffle Action Button */}
            <div className="flex items-stretch gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(computedFlowPrompt);
                    setCopiedVideoPrompt(true);
                    setTimeout(() => setCopiedVideoPrompt(false), 2200);
                  } catch {}
                }}
                className={`flex-1 p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer min-w-0 ${
                  copiedVideoPrompt
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                    : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-700 hover:border-cyan-400 text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Film className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-black uppercase text-cyan-300">
                      {copiedVideoPrompt ? '✓ Copied 4s Video Prompt!' : '2. Copy 4s Video Prompt'}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      Auto-Action: {activePreset.label.replace(/^\d+\.\s*/, '')} ({environment.icon})
                    </div>
                  </div>
                </div>
                {copiedVideoPrompt ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-zinc-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={handleShuffleAction}
                className="px-3 rounded-xl bg-zinc-950 hover:bg-emerald-950 border border-zinc-700 hover:border-emerald-400 text-emerald-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer shrink-0"
                title="Shuffle a new morphology-matched video action"
              >
                <Dices className="w-4 h-4" />
                <span className="text-[9px] font-bold">Action</span>
              </button>
            </div>

            {showPromptPreview && (
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-[11px] text-zinc-300 max-h-48 overflow-y-auto">
                <div>
                  <span className="text-[10px] font-bold text-pink-400 uppercase block">Image Prompt:</span>
                  <p className="text-zinc-400 select-all leading-snug">{encounter.visual_generation_prompt}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase block">4s Video Prompt:</span>
                  <p className="text-zinc-400 select-all leading-snug">{computedFlowPrompt}</p>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Paste / Attach Image & Video */}
          <div
            id="artwork-binder-dropzone"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.length) handleIncomingFiles(e.dataTransfer.files);
            }}
            className={`p-3 rounded-xl border-2 transition-all space-y-2.5 ${
              isDragOver
                ? 'bg-pink-950/30 border-pink-400'
                : 'bg-zinc-950/70 border-dashed border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-200 uppercase">Step 2 • Attach Art & Video</span>
              <span className="text-[10px] text-cyan-400 font-bold">
                {pastedFeedback || 'Ctrl+V or Click'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Still Image Slot */}
              {artworkBlob ? (
                <div className="p-2 rounded-lg border border-pink-600/60 bg-zinc-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <img src={artworkUrl} alt="Art" className="w-10 h-10 object-cover rounded border border-pink-500 shrink-0" />
                    <div className="truncate text-[10px]">
                      <div className="font-bold text-white truncate">Art Ready</div>
                      <button
                        type="button"
                        onClick={handleCopyImageBlobToClipboard}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        {copiedImageToClipboard ? '✓ Copied' : 'Copy Image'}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={removeArtwork} className="p-1 text-red-400 hover:text-red-300 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => singleImageInputRef.current?.click()}
                  className="p-2.5 rounded-lg border border-dashed border-pink-500/50 hover:border-pink-400 bg-pink-950/20 hover:bg-pink-950/30 text-pink-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-pink-400" />
                  <span>Still Art</span>
                </button>
              )}

              {/* 4s Video Slot */}
              {videoBlob ? (
                <div className="p-2 rounded-lg border border-purple-600/60 bg-zinc-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <div className="relative w-10 h-10 rounded overflow-hidden border border-purple-500 bg-black shrink-0">
                      <video ref={videoRef} src={videoUrl} autoPlay loop muted={isVideoMuted} playsInline className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleVideoMute(); }}
                        className="absolute bottom-0 right-0 p-0.5 bg-black/80 text-white"
                      >
                        {isVideoMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5 text-cyan-400" />}
                      </button>
                    </div>
                    <div className="truncate text-[10px]">
                      <div className="font-bold text-white truncate">4s Reel</div>
                      <button
                        type="button"
                        onClick={() => singleVideoInputRef.current?.click()}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={removeVideo} className="p-1 text-red-400 hover:text-red-300 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => singleVideoInputRef.current?.click()}
                  className="p-2.5 rounded-lg border border-dashed border-purple-500/50 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>4s Video</span>
                </button>
              )}
            </div>
          </div>

          {/* STEP 3: Save to Binder */}
          <button
            type="button"
            id="save-to-trapper-keeper-btn"
            onClick={handleSaveToBinder}
            disabled={(!artworkBlob && !videoBlob) || isSavingToBinder || isExtractingFrame}
            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-gradient-to-r from-yellow-300 via-pink-500 to-cyan-400 hover:opacity-95 disabled:opacity-35 cursor-pointer shadow-lg active:scale-99 transition-all flex items-center justify-center gap-2"
          >
            <FolderArchive className="w-4 h-4 fill-black" />
            <span>
              {isSavingToBinder
                ? 'Saving...'
                : artworkBlob || videoBlob
                ? '3. Save Card to Binder'
                : 'Attach Art or Video to Save'}
            </span>
          </button>

          {onOpenZineView && (
            <button
              type="button"
              onClick={onOpenZineView}
              className="w-full py-2.5 px-3 rounded-xl border-2 border-black font-black text-xs uppercase tracking-wider text-zinc-950 bg-[#FFE600] hover:bg-[#B8FF00] shadow-[4px_4px_0_#000] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>📰 Open as Neo-Pop Zine Issue →</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
