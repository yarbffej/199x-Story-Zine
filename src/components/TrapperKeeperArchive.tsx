import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Eye, 
  Film, 
  Image as ImageIcon,
  BookOpen, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Palette, 
  Dices,
  FolderPlus,
  RotateCw,
  X,
  CheckSquare,
  FileText,
  Zap
} from 'lucide-react';
import { playBinderPageFlipSound, playCriticalSmashSound } from '../utils/audio';
import { CombatEncounter, CardThemeType } from '../types';
import { 
  ArchiveCardRecord, 
  getAllArchiveCards, 
  deleteCardFromArchive,
  saveCardToArchive,
  syncMasterChecklist
} from '../utils/archiveDb';
import { generateMasterChecklistVideoBlob } from '../utils/checklistGenerator';
import { DEFAULT_DRIVE_FOLDER_ID } from '../services/googleDrive';
import { DownloadBookModal } from './DownloadBookModal';
import { PrintableBinderSheetModal } from './PrintableBinderSheetModal';
import { CreateChecklistModal } from './CreateChecklistModal';
import { 
  TradingCardVisual, 
  CARD_THEMES_CATALOG, 
  GLOBAL_THEME_STORAGE_KEY,
  getThemeCardStyle,
  ChecklistCardFront
} from './TradingCardVisual';

interface TrapperKeeperArchiveProps {
  currentEncounter?: CombatEncounter;
  onNavigateToRoll?: () => void;
  onNavigateToChecklist?: () => void;
  binderMode?: 'cards' | 'videos' | 'front' | 'back';
}

export const TrapperKeeperArchive: React.FC<TrapperKeeperArchiveProps> = ({ 
  onNavigateToRoll,
  onNavigateToChecklist,
  binderMode = 'cards'
}) => {
  const [savedCards, setSavedCards] = useState<Array<ArchiveCardRecord & { previewUrl: string; videoUrl?: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string>('');
  const [selectedCardModal, setSelectedCardModal] = useState<(ArchiveCardRecord & { previewUrl: string; videoUrl?: string }) | null>(null);
  const [cardToDelete, setCardToDelete] = useState<(ArchiveCardRecord & { previewUrl: string; videoUrl?: string }) | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [isPrintablePageModalOpen, setIsPrintablePageModalOpen] = useState<boolean>(false);
  const [printableSheetTarget, setPrintableSheetTarget] = useState<number>(1);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState<boolean>(false);
  const [isSynthesizingVideo, setIsSynthesizingVideo] = useState<boolean>(false);
  const [isSyncingChecklist, setIsSyncingChecklist] = useState<boolean>(false);

  const [globalTheme, setGlobalTheme] = useState<CardThemeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GLOBAL_THEME_STORAGE_KEY);
      if (saved) return saved as CardThemeType;
    }
    return 'atomic-purple';
  });

  const handleGlobalThemeChange = (nextTheme: CardThemeType) => {
    setGlobalTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, nextTheme);
      window.dispatchEvent(new CustomEvent('199x-theme-changed', { detail: nextTheme }));
    }
    notify(`Applied Finish: ${nextTheme.toUpperCase()}`);
  };

  const handleRandomGlobalTheme = () => {
    const available = CARD_THEMES_CATALOG.filter(t => t.id !== globalTheme);
    const pick = available[Math.floor(Math.random() * available.length)];
    if (pick) handleGlobalThemeChange(pick.id);
  };

  const CARDS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasInitializedPage, setHasInitializedPage] = useState<boolean>(false);

  // Auto-scroll to top when switching between Still Cards and Video Reels
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [binderMode]);

  const checklistCard = useMemo(() => {
    return savedCards.find(c => c.encounter?.card_number === 0 || c.encounter?.card_type === 'checklist');
  }, [savedCards]);

  const specimenCards = useMemo(() => {
    return savedCards
      .filter(c => c !== checklistCard && c.encounter?.card_number !== 0 && c.encounter?.card_type !== 'checklist')
      .sort((a, b) => (a.encounter?.card_number ?? 999) - (b.encounter?.card_number ?? 999));
  }, [savedCards, checklistCard]);

  const isBackMode = binderMode === 'videos' || binderMode === 'back';

  // With Checklist Card (#00) relocated to its dedicated tab,
  // the binder sheets hold specimens #01 to #53 directly in pockets 01 to 53!
  const displayedCards = useMemo(() => {
    return specimenCards;
  }, [specimenCards]);

  const totalPages = Math.max(1, Math.ceil(displayedCards.length / CARDS_PER_PAGE));

  // Auto-navigate to the most recent page on initial load
  useEffect(() => {
    if (displayedCards.length > 0 && !hasInitializedPage) {
      setCurrentPage(totalPages);
      setHasInitializedPage(true);
    }
  }, [displayedCards.length, totalPages, hasInitializedPage]);

  const handleTurnPage = (newPage: number) => {
    if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    playBinderPageFlipSound();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
  const currentSleeveCards = useMemo(() => {
    return displayedCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
  }, [displayedCards, startIndex]);

  const pageSlots = useMemo(() => {
    return Array.from({ length: CARDS_PER_PAGE }, (_, idx) => {
      const card = currentSleeveCards[idx] || null;
      const sleeveNumber = startIndex + idx + 1; // 1-indexed pockets #01, #02... #54
      const isChecklistCard = false;
      const isChecklistSlot = false;
      return { slotIndex: idx, sleeveNumber, card, isChecklistCard, isChecklistSlot };
    });
  }, [currentSleeveCards, startIndex, currentPage]);

  const handleSynthesizeChecklistVideo = async (targetCard: ArchiveCardRecord & { previewUrl: string; videoUrl?: string }) => {
    if (isSynthesizingVideo) return;
    setIsSynthesizingVideo(true);
    notify("Synthesizing 4s VHS Master Calibration Reel...");
    try {
      const videoBlob = await generateMasterChecklistVideoBlob(
        targetCard.encounter.entity_name || 'Series 2 Master Checklist',
        specimenCards.length
      );
      if (videoBlob && videoBlob.size > 0) {
        const updated = await saveCardToArchive(
          targetCard.encounter,
          targetCard.imageBlob,
          targetCard.imageName,
          videoBlob,
          'series-2-master-checklist-reel.webm',
          'video'
        );
        const videoUrl = URL.createObjectURL(videoBlob);
        setSavedCards(prev => prev.map(c => c.id === targetCard.id ? { ...updated, previewUrl: c.previewUrl, videoUrl } : c));
        notify("Master VHS Reel Recorded & Bound to Pocket 01!");
      }
    } catch (err) {
      console.error("Failed to record checklist video:", err);
      notify("Failed to record video reel.");
    } finally {
      setIsSynthesizingVideo(false);
    }
  };

  const handleDirectChecklistSync = async () => {
    if (isSyncingChecklist) return;
    setIsSyncingChecklist(true);
    notify("Synchronizing Series 2 Master Checklist with binder specimens...");
    try {
      const updated = await syncMasterChecklist();
      await loadCards();
      try {
        playCriticalSmashSound();
      } catch {}
      const count = updated?.encounter?.checklist_items?.length || 0;
      notify(`✓ Master Checklist Synchronized! (${count} Specimens Registered)`);
    } catch (err) {
      console.error("Failed to sync checklist:", err);
      notify("Checklist sync encountered an error.");
    } finally {
      setIsSyncingChecklist(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const records = await getAllArchiveCards();
      const withPreviews = records.map(rec => ({
        ...rec,
        previewUrl: URL.createObjectURL(rec.imageBlob),
        videoUrl: rec.videoBlob ? URL.createObjectURL(rec.videoBlob) : undefined
      }));
      setSavedCards(withPreviews);
    } catch (err) {
      console.error('Failed to load cards from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const executeDeleteCard = async (id: string) => {
    try {
      await deleteCardFromArchive(id);
      setSavedCards(prev => prev.filter(c => c.id !== id));
      if (selectedCardModal?.id === id) {
        setSelectedCardModal(null);
      }
      setCardToDelete(null);
      notify("Specimen removed from Trapper Keeper.");
    } catch (err) {
      console.error("Failed to delete card:", err);
    }
  };

  return (
    <div id="trapper-keeper-archive-wrapper" className="space-y-6">
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-pink-950 border border-pink-500 text-pink-200 font-mono text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Trapper Keeper Binder Album Frame */}
      <div 
        id="trapper-keeper-binder" 
        className="relative rounded-3xl p-3 sm:p-6 border-4 border-pink-500 shadow-[0_0_50px_rgba(255,0,127,0.25)] bg-zinc-950 overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 20%, rgba(255, 0, 127, 0.12) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(0, 240, 255, 0.12) 0%, transparent 40%),
            linear-gradient(135deg, #090b12 0%, #120e24 50%, #080c16 100%)
          `
        }}
      >
        {/* 3 Metallic Binder Rings on Left Margin */}
        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex flex-col gap-24 sm:gap-28 z-20 pointer-events-none">
          {[1, 2, 3].map((ring) => (
            <div key={ring} className="relative flex items-center">
              <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full bg-zinc-900 border-2 border-zinc-700 shadow-inner" />
              <div 
                className="absolute -left-2.5 sm:-left-3 w-7 sm:w-8 h-10 sm:h-12 rounded-full border-4 border-zinc-400 shadow-[0_2px_8px_rgba(0,0,0,0.8)] -translate-x-1"
                style={{ background: 'linear-gradient(90deg, #9ca3af 0%, #ffffff 40%, #4b5563 80%, #1f2937 100%)' }}
              />
            </div>
          ))}
        </div>

        {/* Binder Content Area */}
        <div className="ml-5 sm:ml-8 space-y-4">
          
          {/* Header Bar */}
          <div className="border-b border-pink-500/50 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                  isBackMode ? 'bg-pink-500 text-zinc-950' : 'bg-purple-500 text-white'
                }`}>
                  {isBackMode ? 'TRAPPER KEEPER CARDS (BACK)' : 'TRAPPER KEEPER CARDS (FRONT)'}
                </span>
                <span className="text-cyan-400 font-mono text-xs hidden sm:inline">
                  {isBackMode ? 'CLASSIFIED ARCHIVAL STILLS & COMPLETE FIELD DOSSIERS' : '4-SECOND KINETIC MOTION SLEEVES • FRONT FACE (VIDEO REEL)'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2 mt-0.5 font-sans">
                TRAPPER KEEPER CARDS {isBackMode ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-yellow-400">
                    (BACK)
                  </span>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                    (FRONT)
                  </span>
                )}
              </h2>
            </div>

            {/* Finish Switcher & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-700 shadow-xs">
                <Palette className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[11px] font-mono text-zinc-400 font-bold uppercase">FINISH:</span>
                <select
                  value={globalTheme}
                  onChange={(e) => handleGlobalThemeChange(e.target.value as CardThemeType)}
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
                  onClick={handleRandomGlobalTheme}
                  className="p-1 rounded hover:bg-zinc-800 text-yellow-400 cursor-pointer"
                  title="Roll Random Finish"
                >
                  <Dices className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Link to Master Checklist Dedicated Tab */}
              <button
                type="button"
                id="open-create-checklist-modal-button"
                onClick={() => {
                  if (onNavigateToChecklist) onNavigateToChecklist();
                  else setIsChecklistModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500/25 via-amber-500/25 to-orange-500/20 hover:from-yellow-500/40 text-yellow-300 font-mono text-xs font-bold border border-yellow-500/60 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                title="Open Master Checklist (#00) Tab"
              >
                <CheckSquare className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline">MASTER CHECKLIST TAB</span>
                <span className="sm:hidden">CHECKLIST</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400 text-black font-black">#00</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrintableSheetTarget(currentPage);
                  setIsPrintablePageModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/60 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>PRINTABLE VIEW</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/60 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                <span>DOWNLOAD BOOK</span>
              </button>
            </div>
          </div>

          {/* Sheet Navigator Strip with Page Number Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
            <span>
              SHEET <strong className="text-pink-400">{currentPage}</strong> OF {totalPages} • SPECIMENS #{startIndex === 0 ? '00' : String(startIndex).padStart(2, '0')} TO #{String(Math.min(startIndex + 8, 53)).padStart(2, '0')}
            </span>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTurnPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-30 cursor-pointer text-zinc-200 font-bold flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>PREV</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={`page-pill-${page}`}
                      type="button"
                      onClick={() => handleTurnPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === page
                          ? 'bg-pink-600 text-white font-black shadow-[0_0_10px_rgba(255,0,127,0.5)] border border-pink-400'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleTurnPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-30 cursor-pointer text-zinc-200 font-bold flex items-center gap-1 text-xs"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Authentic Translucent Ultra PRO Polypropylene 9-Pocket Sheet Page */}
          <div 
            id={`binder-page-sheet-${currentPage}`}
            className="rounded-3xl p-3 sm:p-5 border-2 border-zinc-800/90 shadow-2xl relative space-y-4 bg-zinc-950/80 backdrop-blur-md overflow-hidden"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.04) 0%, transparent 60%),
                linear-gradient(180deg, rgba(24, 24, 27, 0.75) 0%, rgba(9, 9, 11, 0.98) 100%)
              `
            }}
          >
            {/* 3 Punched Hole Grommets on Sheet Margin */}
            <div className="absolute -left-2.5 sm:-left-3.5 top-1/2 -translate-y-1/2 flex flex-col gap-24 sm:gap-28 pointer-events-none z-10">
              {[1, 2, 3].map((hole) => (
                <div 
                  key={`sheet-hole-${hole}`}
                  className="w-4 sm:w-5 h-4 sm:h-5 rounded-full border-2 border-zinc-600/80 bg-zinc-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 rounded-full border border-zinc-700 bg-zinc-900" />
                </div>
              ))}
            </div>

            {/* Top Heat-Welded Header on Polypropylene Sheet */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse inline-block" />
                <span className="text-zinc-200 font-bold">
                  199X ARCHIVAL POLYPROPYLENE // 9-POCKET TOP-LOADING SHEET #{String(currentPage).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500 hidden sm:flex">
                <span>TOP-LOADING 3×3 POCKET MATRIX (2.5" × 3.5")</span>
                <span>ACID FREE • NO PVC</span>
              </div>
            </div>

            {/* 3×3 POCKET MATRIX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {pageSlots.map((slot) => {
                const { card, sleeveNumber, slotIndex, isChecklistCard, isChecklistSlot } = slot;
                const isChecklist = isChecklistCard || (!card && isChecklistSlot);
                const threatColor = isChecklistCard ? '#FFE600' : (card?.encounter?.threat_level_color || '#00F0FF');
                const isPrism = card?.encounter?.card_foil_rarity === 'prism';
                const isGold = isChecklistCard || card?.encounter?.card_foil_rarity === 'gold';
                const isSilver = card?.encounter?.card_foil_rarity === 'silver';

                const sleeveCardStyle = getThemeCardStyle(
                  isChecklistCard ? (card?.encounter?.card_theme || 'gold-embossed') : globalTheme, 
                  threatColor, 
                  isPrism, 
                  isGold, 
                  isSilver
                );

                return (
                  <div 
                    key={`sleeve-pocket-${slotIndex}`}
                    className="relative rounded-2xl border-2 border-zinc-700/60 p-2 sm:p-2.5 transition-all duration-200 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] shadow-lg flex flex-col justify-between group"
                    style={{ minHeight: '440px' }}
                  >
                    <div className="absolute inset-1 rounded-xl border border-white/[0.06] pointer-events-none" />

                    {/* Translucent Sleeve Top-Loading Lip */}
                    <div className="w-full flex items-center justify-between text-[9.5px] font-mono border-b border-zinc-800/80 pb-1.5 mb-2 shrink-0 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-cyan-400">
                          ULTRA-PRO POCKET #{String(slotIndex + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-[8.5px] uppercase tracking-wider text-zinc-500">
                        {card ? (isChecklistCard ? 'CARD #00' : `CARD #${String(card.encounter.card_number).padStart(2, '0')}`) : (isChecklistSlot ? '[ CHECKLIST ANCHOR ]' : '[ VACANT ]')}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent rounded-2xl pointer-events-none z-10" />

                    {card ? (
                      /* The Trading Card Inside the Pocket with Synchronized Finish */
                      <div 
                        className="rounded-xl border-2 p-3 space-y-2.5 flex-1 flex flex-col justify-between overflow-hidden shadow-2xl relative transition-transform duration-200 group-hover:scale-[1.01] cursor-pointer"
                        style={sleeveCardStyle}
                        onClick={() => setSelectedCardModal(card)}
                      >
                        {isChecklistCard ? (
                          /* DEDICATED FULL-BLEED CHECKLIST VIEW IN SLEEVE */
                          <div className="w-full h-full flex-1 flex flex-col justify-between overflow-hidden">
                            <ChecklistCardFront 
                              encounter={card.encounter}
                              cardNumber={0}
                              foilRarity="gold"
                              threatColor="#FFE600"
                              theme={card.encounter?.card_theme || 'gold-embossed'}
                              hideControls={true}
                            />
                          </div>
                        ) : !isBackMode ? (
                          /* STANDARD SPECIMEN CARD IN SLEEVE - FRONT FACE (4S VIDEO REEL) */
                          <>
                            {/* Card Top Strip */}
                            <div className="flex items-center justify-between text-[9px] font-mono border-b border-black/40 pb-1 shrink-0">
                              <span className="font-black text-white bg-black/80 px-1.5 py-0.5 rounded shadow-xs">
                                SERIES 2 #{String(card.encounter.card_number).padStart(2, '0')}
                              </span>
                              <span 
                                className="font-black px-1.5 py-0.5 rounded uppercase text-black shadow-xs" 
                                style={{ backgroundColor: threatColor }}
                              >
                                {card.encounter.critical_smash ? 'CRITICAL' : 'THREAT'}
                              </span>
                            </div>

                            {/* Angled Retro Title Banner */}
                            <div className="px-2.5 py-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 border border-black text-zinc-950 shadow-[2px_2px_0px_#000] -skew-x-3 shrink-0">
                              <span className="skew-x-3 text-xs font-black uppercase truncate block leading-tight font-sans">
                                {card.encounter.entity_name}
                              </span>
                            </div>

                            {/* 4:3 Aperture: Plays 4S Video Loop on the Front of the Card */}
                            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border-2 border-black bg-black shrink-0 shadow-inner">
                              {card.videoUrl ? (
                                <>
                                  <video 
                                    src={card.videoUrl} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    ref={(el) => {
                                      if (el) {
                                        el.muted = true;
                                        el.play().catch(() => {});
                                      }
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.35)_3px)] opacity-60 z-10" />
                                  <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/85 text-[7.5px] font-mono font-bold text-yellow-300 border border-yellow-500/50 flex items-center gap-1 z-20">
                                    <Film className="w-2.5 h-2.5 text-yellow-400" />
                                    <span>4S ACTION REEL</span>
                                  </div>
                                  <div className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-red-950/80 text-[6.5px] font-mono font-bold text-red-400 border border-red-800/80 z-20 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span>REC 24FPS</span>
                                  </div>
                                </>
                              ) : card.previewUrl ? (
                                <>
                                  <img 
                                    src={card.previewUrl} 
                                    alt={card.encounter.entity_name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                  />
                                  <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.25)_3px)] opacity-40 z-10" />
                                  <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/85 text-[7.5px] font-mono font-bold text-cyan-300 border border-zinc-700 flex items-center gap-1">
                                    <ImageIcon className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>199X ART</span>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-zinc-500 font-mono text-[9px]">
                                  <Film className="w-5 h-5 text-zinc-600 mb-1" />
                                  <span>NO ACTION REEL</span>
                                </div>
                              )}
                            </div>

                            {/* Front Card Footer Telemetry */}
                            <div className="space-y-1 bg-black/75 p-1.5 rounded-lg border border-zinc-800 text-[8.5px] font-mono shrink-0">
                              <div className="flex items-center justify-between text-zinc-400">
                                <span>STATUS:</span>
                                <span className="text-emerald-400 font-bold truncate max-w-[150px]">
                                  {card.encounter.status_affliction || 'SECURED'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[7.5px] text-zinc-500 pt-0.5 border-t border-zinc-800">
                                <span>SERIES 2 • CARD #{String(card.encounter.card_number).padStart(2, '0')}</span>
                                <span className="text-yellow-400 font-bold">★ 199X HOBBY</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* STANDARD SPECIMEN CARD IN SLEEVE - BACK FACE (STILL & COMPLETE FIELD DOSSIER) */
                          <>
                            {/* Card Top Strip */}
                            <div className="flex items-center justify-between text-[9px] font-mono border-b border-black/40 pb-1 shrink-0">
                              <span className={`font-black text-white px-1.5 py-0.5 rounded shadow-xs ${
                                card.encounter.card_type === 'good_guy' ? 'bg-cyan-700' : 'bg-red-700'
                              }`}>
                                {card.encounter.card_type === 'good_guy' ? '199X DOSSIER' : '199X THREAT'}
                              </span>
                              <span className="font-mono text-yellow-300 font-bold text-[8.5px] truncate max-w-[130px]">
                                {card.encounter.entity_name}
                              </span>
                            </div>

                            {/* 4:3 Aperture: High-Res Archival Still Image */}
                            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border-2 border-black bg-black shrink-0 shadow-inner">
                              {card.previewUrl ? (
                                <>
                                  <img 
                                    src={card.previewUrl} 
                                    alt={card.encounter.entity_name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                  />
                                  <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.25)_3px)] opacity-35 z-10" />
                                  <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/85 text-[7.5px] font-mono font-bold text-cyan-300 border border-zinc-700 flex items-center gap-1">
                                    <ImageIcon className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>ARCHIVAL STILL</span>
                                  </div>
                                </>
                              ) : card.videoUrl ? (
                                <video 
                                  src={card.videoUrl} 
                                  autoPlay 
                                  loop 
                                  muted 
                                  playsInline 
                                  className="w-full h-full object-cover opacity-80" 
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-zinc-500 font-mono text-[9px]">
                                  <ImageIcon className="w-5 h-5 text-zinc-600 mb-1" />
                                  <span>NO STILL ARCHIVE</span>
                                </div>
                              )}
                            </div>

                            {/* Complete Field Dossier Narrative Box */}
                            <div className="p-2 bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 border border-black text-zinc-950 shadow-[1px_1px_0px_#000] rounded-lg flex-1 min-h-[72px] max-h-[110px] flex flex-col justify-between overflow-hidden">
                              <div className="flex items-center justify-between text-[7.5px] font-mono font-black uppercase tracking-wider pb-0.5 border-b border-black/25 shrink-0">
                                <span className="px-1 py-0.2 bg-black text-cyan-300 rounded-xs flex items-center gap-0.5">
                                  <FileText className="w-2 h-2" />
                                  FIELD DOSSIER
                                </span>
                                <span className="text-[7px] font-black bg-white/90 border border-black/40 px-1 py-0.2 rounded-xs">
                                  CLASSIFIED
                                </span>
                              </div>
                              <div className="flex-1 overflow-y-auto pr-0.5 text-[8.5px] leading-tight font-serif font-bold text-zinc-950 my-0.5">
                                {card.encounter.cosmic_distortion || "Dimensional rupture confirmed in suburban quadrant. Local retail physics destabilized under anomalous radiation."}
                              </div>
                            </div>

                            {/* Power Ratings Matrix */}
                            <div className="p-1 bg-gradient-to-r from-pink-400 via-rose-300 to-fuchsia-400 border border-black text-zinc-950 shadow-[1px_1px_0px_#000] rounded-md shrink-0">
                              <div className="flex items-center justify-between text-[7px] font-mono font-black uppercase pb-0.5 border-b border-black/20 mb-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Zap className="w-2 h-2 text-yellow-300" />
                                  IMPEL POWER
                                </span>
                                <span className="text-[7px] font-mono">
                                  #199X-{String(card.encounter.card_number).padStart(2, '0')}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-1 text-[7px] font-mono font-bold text-center">
                                <div className="bg-black/10 rounded py-0.2">STR: {(card.encounter as any).impel_ratings?.strength ?? 5}</div>
                                <div className="bg-black/10 rounded py-0.2">SPD: {(card.encounter as any).impel_ratings?.speed ?? 4}</div>
                                <div className="bg-black/10 rounded py-0.2">ENG: {(card.encounter as any).impel_ratings?.energy ?? 6}</div>
                                <div className="bg-black/10 rounded py-0.2">PSY: {(card.encounter as any).impel_ratings?.psychic ?? 7}</div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Card Footer Toolbar with SYNC & Inspect */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-black/40 text-[8.5px] font-mono shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCardModal(card);
                            }}
                            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isChecklistCard ? 'Inspect Checklist' : (isBackMode ? 'Inspect Back (Dossier)' : 'Inspect Front (Reel)')}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            {isChecklistCard && (
                              <>
                                {binderMode === 'videos' && !card.videoUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSynthesizeChecklistVideo(card);
                                    }}
                                    disabled={isSynthesizingVideo}
                                    className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-300 border border-purple-500/60 text-[10px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Synthesize 4s VHS Master Loop for Card #00"
                                  >
                                    <Film className="w-3 h-3" />
                                    <span>{isSynthesizingVideo ? 'RECORDING...' : 'ATTACH REEL'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  id="checklist-sync-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectChecklistSync();
                                  }}
                                  disabled={isSyncingChecklist}
                                  className="px-2 py-0.5 rounded bg-yellow-400/20 hover:bg-yellow-400 hover:text-black text-yellow-300 border border-yellow-500/50 text-[10px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                  title="Instantly synchronize newly collected specimens into Series 2 Checklist"
                                >
                                  <RotateCw className={`w-3 h-3 ${isSyncingChecklist ? 'animate-spin text-yellow-400' : ''}`} />
                                  <span>{isSyncingChecklist ? 'SYNCING...' : 'SYNC'}</span>
                                </button>
                                <button
                                  type="button"
                                  id="open-checklist-customizer-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsChecklistModalOpen(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 text-[10px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                  title="Customize Checklist Title, Theme, or Foil"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>EDIT</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCardToDelete(card);
                              }}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Delete Card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : isChecklistSlot ? (
                      /* Vacant Checklist Anchor Slot */
                      <div className="h-full flex-1 flex flex-col justify-between items-center text-center p-4 font-mono rounded-xl border-2 border-dashed border-yellow-500/70 bg-yellow-950/20 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        <div className="text-[10px] w-full text-left font-bold text-yellow-400">
                          SLEEVE #00 • [ CHECKLIST ANCHOR ]
                        </div>
                        <div className="space-y-1.5 my-auto">
                          <div className="w-12 h-12 rounded-2xl border border-yellow-400 bg-yellow-400/20 text-yellow-300 mx-auto flex items-center justify-center animate-pulse">
                            <RotateCw className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-black uppercase block text-yellow-300">
                            MASTER CHECKLIST CARD
                          </span>
                          <span className="text-[9px] text-zinc-400 block max-w-[180px]">
                            Anchor Card #00 to catalog all 53 suburban specimens
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <button
                            type="button"
                            id="vacant-checklist-sync-button"
                            onClick={() => handleDirectChecklistSync()}
                            disabled={isSyncingChecklist}
                            className="w-full py-1.5 px-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${isSyncingChecklist ? 'animate-spin' : ''}`} />
                            <span>{isSyncingChecklist ? 'SYNCING...' : '+ SYNC & BIND #00'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsChecklistModalOpen(true)}
                            className="w-full py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold border border-zinc-700 cursor-pointer"
                          >
                            CUSTOMIZE CHECKLIST
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Vacant Archival Sleeve */
                      <div className="h-full flex-1 flex flex-col justify-between items-center text-center p-4 font-mono text-zinc-500 rounded-xl border border-dashed border-zinc-800/80 bg-black/20">
                        <div className="text-[10px] w-full text-left font-bold text-zinc-600">
                          POCKET #{String(sleeveNumber).padStart(2, '0')}
                        </div>
                        <div className="space-y-1.5 my-auto">
                          <div className="w-12 h-12 rounded-2xl border border-dashed border-zinc-700 mx-auto flex items-center justify-center text-zinc-500 bg-zinc-900/60 shadow-inner">
                            <FolderPlus className="w-5 h-5 text-zinc-500" />
                          </div>
                          <span className="text-xs font-bold uppercase block text-zinc-400">EMPTY SLEEVE</span>
                          <span className="text-[9px] text-zinc-600 block">Top-Loading Archival Pocket</span>
                        </div>
                        {onNavigateToRoll && (
                          <button
                            type="button"
                            onClick={onNavigateToRoll}
                            className="text-xs text-pink-400 hover:text-pink-300 font-bold underline cursor-pointer"
                          >
                            + Roll Encounter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card Inspector Modal */}
      {selectedCardModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setSelectedCardModal(null)}
        >
          <div 
            className="max-w-4xl w-full my-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCardToDelete(selectedCardModal)}
                  className="px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delete Card</span>
                </button>

                {(selectedCardModal.encounter.card_type === 'checklist' || selectedCardModal.encounter.card_number === 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCardModal(null);
                      setIsChecklistModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-yellow-400/20 hover:bg-yellow-400 text-yellow-300 hover:text-black text-xs font-bold border border-yellow-500/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Sync Checklist</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardModal(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-600 cursor-pointer"
              >
                ✕ Close Inspector
              </button>
            </div>

            <TradingCardVisual 
              encounter={selectedCardModal.encounter}
              imageUrl={selectedCardModal.previewUrl}
              videoUrl={selectedCardModal.videoUrl}
              cardNumber={selectedCardModal.encounter.card_number}
              foilRarity={selectedCardModal.encounter.card_foil_rarity}
              cardTheme={globalTheme}
              onThemeChange={handleGlobalThemeChange}
              displaySide="both"
            />
          </div>
        </div>
      )}

      {/* Incinerate / Delete Confirmation Modal */}
      {cardToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-zinc-100"
          onClick={() => setCardToDelete(null)}
        >
          <div 
            className="max-w-md w-full rounded-2xl bg-zinc-950 border-2 border-red-500/80 p-6 space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase">
              <Trash2 className="w-5 h-5 text-red-500 animate-pulse" />
              <span>INCINERATE CARD // BINDER SLEEVE</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Permanently remove <strong className="text-yellow-300">"{cardToDelete.encounter.entity_name}"</strong> from your Trapper Keeper album?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold cursor-pointer"
              >
                KEEP CARD
              </button>
              <button
                type="button"
                onClick={() => executeDeleteCard(cardToDelete.id)}
                className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-500 text-xs font-black cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>CONFIRM INCINERATE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book & Sheet Modals */}
      <DownloadBookModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        cards={displayedCards}
        currentSheetNumber={currentPage}
      />

      <PrintableBinderSheetModal
        isOpen={isPrintablePageModalOpen}
        onClose={() => setIsPrintablePageModalOpen(false)}
        cards={displayedCards}
        initialSheetNumber={printableSheetTarget}
        binderMode={binderMode}
      />

      <CreateChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        savedCards={savedCards}
        onChecklistCreated={() => {
          loadCards();
          notify("Series 2 Master Checklist Bound to Sheet 1, Pocket 1!");
        }}
      />
    </div>
  );
};