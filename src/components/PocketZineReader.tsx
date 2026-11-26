import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Film,
  Music,
  Image as ImageIcon,
  Sparkles,
  Wrench,
  FolderOpen,
} from 'lucide-react';
import { ZineIssueData } from '../engine/zineEngine';
import { StudioUiTheme, STUDIO_UI_THEMES } from '../data/uiThemes';
import { getZinePalette, ZinePaletteId } from '../data/zinePalettes';
import { ZineIssueView } from './ZineIssueView';
import { playZineBlip, playZineResonanceChime } from '../utils/audio';
import { importZineFilesFromDrive } from '../utils/zineStorage';

interface PocketZineReaderProps {
  issues: ZineIssueData[];
  uiTheme: StudioUiTheme;
  onSelectUiTheme: (themeId: StudioUiTheme['id']) => void;
  onRefreshShelf?: () => Promise<void>;
  onExitReader?: () => void;
}

export const PocketZineReader: React.FC<PocketZineReaderProps> = ({
  issues,
  uiTheme,
  onSelectUiTheme,
  onRefreshShelf,
  onExitReader,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [localPalettes, setLocalPalettes] = useState<Record<string, ZinePaletteId>>({});
  const driveInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDriveZines = async (files: FileList | File[]) => {
    try {
      playZineResonanceChime();
      await importZineFilesFromDrive(files);
      await onRefreshShelf?.();
      if (files.length === 1 && !files[0].name.endsWith('.zineshelf.json')) {
        setOpenIndex(0);
      }
    } catch {
      // ignore invalid file
    }
  };

  const activeIssue = openIndex !== null ? issues[openIndex] : null;
  const isDark = uiTheme.isDark;

  return (
    <div
      className="min-h-screen font-zine-sans transition-colors duration-300 pb-12"
      style={{
        backgroundColor: uiTheme.bgColor,
        backgroundImage: uiTheme.bgImage,
        backgroundSize: uiTheme.bgSize,
        color: uiTheme.canvasText,
      }}
    >
      {/* Compact Sticky Pocket Reader Header */}
      <header
        className="sticky top-0 z-40 border-b-[3px] theme-border px-3.5 py-2.5 backdrop-blur-md"
        style={{
          backgroundColor: uiTheme.headerBg,
          color: uiTheme.headerInk,
        }}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
          {activeIssue !== null && openIndex !== null ? (
            <>
              <button
                type="button"
                onClick={() => {
                  playZineBlip(740);
                  setOpenIndex(null);
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
                style={{
                  backgroundColor: uiTheme.accent1,
                  color: uiTheme.accent1Ink,
                }}
                className="pop-btn px-3 py-1.5 font-mono-zine text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Shelf
              </button>

              <span className="font-display font-extrabold text-xs sm:text-sm uppercase truncate">
                Issue #{activeIssue.issueNumber}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={issues.length <= 1}
                  onClick={() => {
                    playZineBlip(820);
                    setOpenIndex((openIndex - 1 + issues.length) % issues.length);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  style={{
                    backgroundColor: uiTheme.surfaceElevated,
                    color: uiTheme.ink,
                  }}
                  className="pop-btn px-2.5 py-1.5 font-mono-zine text-xs font-bold uppercase flex items-center cursor-pointer"
                  title="Previous Issue"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  type="button"
                  disabled={issues.length <= 1}
                  onClick={() => {
                    playZineBlip(880);
                    setOpenIndex((openIndex + 1) % issues.length);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  style={{
                    backgroundColor: uiTheme.accent2,
                    color: uiTheme.accent2Ink,
                  }}
                  className="pop-btn px-2.5 py-1.5 font-mono-zine text-xs font-bold uppercase flex items-center cursor-pointer"
                  title="Next Issue"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: uiTheme.logoBg,
                    color: uiTheme.logoText,
                  }}
                  className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-xs font-bold uppercase"
                >
                  📱 199X ZINE RACK
                </span>
                <span className="font-mono-zine text-xs font-bold opacity-80">
                  {issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={driveInputRef}
                  type="file"
                  multiple
                  accept=".json,.zine.json,.zineshelf.json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void handleOpenDriveZines(e.target.files);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => driveInputRef.current?.click()}
                  style={{
                    backgroundColor: uiTheme.accent3,
                    color: uiTheme.accent3Ink,
                  }}
                  className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  title="Pick a .zine.json file from Google Drive or Files"
                >
                  <FolderOpen className="w-3 h-3" /> Open Drive
                </button>

                {onExitReader && (
                  <button
                    type="button"
                    onClick={onExitReader}
                    style={{
                      backgroundColor: uiTheme.surfaceElevated,
                      color: uiTheme.ink,
                    }}
                    className="px-2.5 py-1 rounded-lg border-2 theme-border font-mono-zine text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Wrench className="w-3 h-3" /> Studio
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Horizontal Backdrop Theme Strip */}
        <div className="max-w-[1400px] mx-auto flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
          {STUDIO_UI_THEMES.map((th) => {
            const selected = th.id === uiTheme.id;
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => {
                  playZineBlip(800);
                  onSelectUiTheme(th.id);
                }}
                style={{
                  backgroundColor: selected ? th.accent1 : uiTheme.surfaceBg,
                  color: selected ? th.accent1Ink : uiTheme.ink,
                }}
                className={`px-2.5 py-1 rounded-full border-2 theme-border font-mono-zine text-[10px] font-bold uppercase shrink-0 cursor-pointer flex items-center gap-1 ${
                  selected ? 'scale-105' : 'opacity-80'
                }`}
              >
                <span>{th.emoji}</span>
                <span>{th.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-5 pt-5">
        {activeIssue ? (
          <ZineIssueView
            issue={{
              ...activeIssue,
              zinePaletteId:
                localPalettes[activeIssue.id] || activeIssue.zinePaletteId,
            }}
            onUpdatePalette={(pid) =>
              setLocalPalettes((prev) => ({ ...prev, [activeIssue.id]: pid }))
            }
            uiTheme={uiTheme}
            readerMode={true}
          />
        ) : (
          <div className="space-y-5">
            <div
              style={{
                backgroundColor: uiTheme.mastheadBg,
                color: uiTheme.ink,
              }}
              className="pop-card p-5 space-y-1.5"
            >
              <div className="font-mono-zine text-xs font-bold uppercase flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> POCKET ZINE READER
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase leading-tight">
                199X Suburban Cosmic Zine Shelf
              </h1>
              <p
                style={{ color: isDark ? uiTheme.mutedInk : '#404040' }}
                className="text-xs font-semibold"
              >
                Tap any magazine cover below to read the full 3-Act Chronicle, watch the Hero Cinema &amp; Story GIFs, and spin the soundtrack.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {issues.map((iss, idx) => {
                const pal = getZinePalette(iss.zinePaletteId);
                const coverImg =
                  iss.galleryUrls[1] ||
                  iss.galleryUrls[0] ||
                  iss.cardImageUrl ||
                  iss.galleryUrls[2];
                const shotCount = iss.galleryUrls.filter(Boolean).length;

                return (
                  <div
                    key={iss.id}
                    onClick={() => {
                      playZineBlip(890);
                      setOpenIndex(idx);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    style={{
                      backgroundColor: isDark
                        ? uiTheme.surfaceBg
                        : pal.paperBg,
                      color: isDark ? uiTheme.ink : pal.ink,
                    }}
                    className="pop-card pop-card-lift overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    <div
                      style={{
                        backgroundColor: isDark
                          ? uiTheme.accent1
                          : pal.heroYellow,
                        color: isDark ? uiTheme.accent1Ink : '#121212',
                      }}
                      className="px-4 py-2 border-b-[3px] theme-border flex items-center justify-between font-mono-zine text-xs font-bold uppercase"
                    >
                      <span>ISSUE #{iss.issueNumber}</span>
                      <span>{iss.sectorTag}</span>
                    </div>

                    <div className="relative aspect-[16/10] bg-[#121212] border-b-[3px] theme-border overflow-hidden flex items-center justify-center">
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={iss.title}
                          className="w-full h-full object-cover"
                        />
                      ) : iss.videoUrl ? (
                        <video
                          src={iss.videoUrl}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-6 text-center space-y-2">
                          <Sparkles className="w-8 h-8 text-yellow-400 mx-auto" />
                          <div className="font-display text-lg font-extrabold text-white uppercase">
                            {iss.title}
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
                        {iss.videoUrl && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-black border border-black font-mono-zine text-[10px] font-bold flex items-center gap-1">
                            <Film className="w-3 h-3" /> 1080P
                          </span>
                        )}
                        {shotCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-300 text-black border border-black font-mono-zine text-[10px] font-bold flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> {shotCount} SHOTS
                          </span>
                        )}
                        {iss.audioUrl && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white border border-black font-mono-zine text-[10px] font-bold flex items-center gap-1">
                            <Music className="w-3 h-3" /> SONG
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h2 className="font-display text-xl font-extrabold uppercase leading-tight">
                        {iss.title}
                      </h2>
                      <p className="text-xs opacity-80 line-clamp-2">
                        📍 {iss.location}
                      </p>
                      <div
                        style={{
                          backgroundColor: isDark
                            ? uiTheme.accent2
                            : pal.popPink,
                          color: isDark ? uiTheme.accent2Ink : '#FFFFFF',
                        }}
                        className="pop-btn mt-2 py-2 text-center font-display font-extrabold text-xs uppercase"
                      >
                        Read Issue #{iss.issueNumber} →
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
