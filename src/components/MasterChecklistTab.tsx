import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CheckSquare, 
  RotateCw, 
  Film, 
  Sparkles, 
  Printer, 
  ArrowRight, 
  Dices, 
  FolderArchive,
  Check,
  AlertCircle,
  Shield,
  Layers,
  Sparkle
} from 'lucide-react';
import { 
  ArchiveCardRecord, 
  getAllArchiveCards, 
  syncMasterChecklist,
  saveCardToArchive 
} from '../utils/archiveDb';
import { generateMasterChecklistVideoBlob } from '../utils/checklistGenerator';
import { CombatEncounter, ChecklistItem, CardThemeType } from '../types';
import { playCriticalSmashSound, playBinderPageFlipSound } from '../utils/audio';
import { 
  TradingCardVisual, 
  CARD_THEMES_CATALOG, 
  GLOBAL_THEME_STORAGE_KEY,
  getThemeCardStyle,
  ChecklistCardFront,
  ChecklistCardBack
} from './TradingCardVisual';
import { CreateChecklistModal } from './CreateChecklistModal';
import { PrintableBinderSheetModal } from './PrintableBinderSheetModal';

interface MasterChecklistTabProps {
  onNavigateToBinder: (mode?: 'cards' | 'videos') => void;
  onNavigateToRoll: () => void;
}

export const MasterChecklistTab: React.FC<MasterChecklistTabProps> = ({
  onNavigateToBinder,
  onNavigateToRoll
}) => {
  const [allCards, setAllCards] = useState<Array<ArchiveCardRecord & { previewUrl: string; videoUrl?: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSynthesizingVideo, setIsSynthesizingVideo] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [activeCardSide, setActiveCardSide] = useState<'front' | 'back' | 'both'>('front');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [globalTheme, setGlobalTheme] = useState<CardThemeType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(GLOBAL_THEME_STORAGE_KEY);
      if (saved) return saved as CardThemeType;
    }
    return 'prismatic-refractor';
  });

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await getAllArchiveCards();
      const withPreviews = records.map((record) => ({
        ...record,
        previewUrl: URL.createObjectURL(record.imageBlob),
        videoUrl: record.videoBlob ? URL.createObjectURL(record.videoBlob) : undefined
      }));
      setAllCards(withPreviews);
    } catch (err) {
      console.error('Failed loading archive cards in MasterChecklistTab:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Primary checklist card
  const checklistCard = useMemo(() => {
    return allCards.find(c => 
      c.encounter?.card_number === 0 || 
      c.encounter?.card_type === 'checklist' || 
      c.imageName.includes('checklist')
    );
  }, [allCards]);

  // Specimen cards #01 to #53
  const specimenCards = useMemo(() => {
    return allCards
      .filter(c => c !== checklistCard && c.encounter?.card_number !== 0 && c.encounter?.card_type !== 'checklist')
      .sort((a, b) => (a.encounter?.card_number || 0) - (b.encounter?.card_number || 0));
  }, [allCards, checklistCard]);

  // Full 53 slots matrix
  const fullRoster = useMemo(() => {
    const map = new Map<number, ArchiveCardRecord & { previewUrl: string; videoUrl?: string }>();
    specimenCards.forEach((card) => {
      const num = card.encounter.card_number || 1;
      map.set(num, card);
    });

    return Array.from({ length: 53 }, (_, idx) => {
      const slotNum = idx + 1;
      const card = map.get(slotNum);
      return {
        number: slotNum,
        card: card || null,
        isSecured: Boolean(card),
        name: card?.encounter.entity_name || `Suburban Specimen #${slotNum}`,
        threatColor: card?.encounter.threat_level_color || '#38bdf8',
        rarity: card?.encounter.card_foil_rarity || 'standard',
        hasVideo: Boolean(card?.videoUrl),
        location: card?.encounter.cosmic_distortion
      };
    });
  }, [specimenCards]);

  const securedCount = specimenCards.length;
  const progressPercent = Math.min(100, Math.round((securedCount / 53) * 100));

  // Quick 1-click sync
  const handleSyncRegister = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    notify("Synchronizing Master Checklist with binder specimens...");
    try {
      const updated = await syncMasterChecklist();
      await loadData();
      try {
        playCriticalSmashSound();
      } catch {}
      const count = updated?.encounter?.checklist_items?.length || 0;
      notify(`✓ Master Checklist Synchronized! (${count} Specimens Registered)`);
    } catch (err) {
      console.error('Failed to sync checklist:', err);
      notify("Sync failed. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Synthesize 4s VHS video loop for Card #00
  const handleSynthesizeReel = async () => {
    if (isSynthesizingVideo) return;
    setIsSynthesizingVideo(true);
    notify("Synthesizing 4s VHS Master Calibration Reel...");
    try {
      const title = checklistCard?.encounter.entity_name || '199X Series 2 Master Checklist';
      const videoBlob = await generateMasterChecklistVideoBlob(title, securedCount);
      if (videoBlob && videoBlob.size > 0 && checklistCard) {
        await saveCardToArchive(
          checklistCard.encounter,
          checklistCard.imageBlob,
          checklistCard.imageName,
          videoBlob,
          'series-2-master-checklist-reel.webm',
          'video'
        );
        await loadData();
        notify("Master VHS Reel Recorded & Attached to Checklist Card #00!");
      }
    } catch (err) {
      console.error('Failed synthesizing video reel:', err);
      notify("Video reel synthesis encountered an error.");
    } finally {
      setIsSynthesizingVideo(false);
    }
  };

  // Filtered specimen roster
  const filteredRoster = useMemo(() => {
    return fullRoster.filter((item) => {
      if (filterRarity !== 'all') {
        if (filterRarity === 'secured' && !item.isSecured) return false;
        if (filterRarity === 'missing' && item.isSecured) return false;
        if (filterRarity === 'videos' && !item.hasVideo) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNum = String(item.number).includes(q);
        return matchesName || matchesNum;
      }
      return true;
    });
  }, [fullRoster, filterRarity, searchQuery]);

  return (
    <div className="w-full space-y-7 font-mono text-zinc-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-4 py-2.5 rounded-xl font-mono text-xs font-black shadow-[0_0_30px_rgba(234,179,8,0.5)] border border-yellow-300 animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Masthead */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-yellow-500/70 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-5 sm:p-7 shadow-[0_0_50px_rgba(234,179,8,0.25)]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#FFE600_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-xs">
                ★ ARCHIVAL CAPSTONE
              </span>
              <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold">
                CARD #00
              </span>
              <span className="text-xs text-zinc-500 hidden sm:inline">•</span>
              <span className="text-xs text-zinc-400 hidden sm:inline">SERIES 2 SPECIMEN REGISTER</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 font-sans tracking-tight">
              199X Master Checklist
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Permanent central ledger cataloging all 53 suburban anomalies secured within your Trapper Keeper album.
              Autonomous two-way synchronization connects your binder pockets directly to Card #00.
            </p>
          </div>

          {/* Quick Progress Dial */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-black/60 p-4 rounded-2xl border border-yellow-500/40 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-bold uppercase">Archival Set Progress</span>
                <span className="text-yellow-400 font-black">{progressPercent}%</span>
              </div>
              <div className="w-48 sm:w-60 h-3 rounded-full bg-zinc-900 border border-zinc-700 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>{securedCount} OF 53 SECURED</span>
                <span>{53 - securedCount} REMAINING</span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
              <button
                type="button"
                id="master-tab-sync-btn"
                onClick={handleSyncRegister}
                disabled={isSyncing}
                className="flex-1 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
                title="Synchronize all specimens currently in your album"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'SYNCING...' : 'SYNC REGISTER'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizerOpen(true)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-300 border border-yellow-500/50 text-[11px] font-bold uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>CUSTOMIZE CARD</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Card Showcase & Specimen Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Column: Card #00 Visual Interactive Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-black uppercase text-yellow-300">
                Official Capstone Card (#00)
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveCardSide('front')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeCardSide === 'front' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                FRONT
              </button>
              <button
                type="button"
                onClick={() => setActiveCardSide('back')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeCardSide === 'back' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                BACK
              </button>
              <button
                type="button"
                onClick={() => setActiveCardSide('both')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  activeCardSide === 'both' ? 'bg-yellow-400 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                BOTH
              </button>
            </div>
          </div>

          {/* Card Presentation Frame */}
          <div className="p-4 sm:p-6 rounded-3xl bg-zinc-950 border-2 border-yellow-500/50 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[520px]">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-yellow-500/[0.04] via-transparent to-cyan-500/[0.04]" />

            {checklistCard ? (
              <div className="w-full flex justify-center">
                <TradingCardVisual 
                  encounter={checklistCard.encounter}
                  imageUrl={checklistCard.previewUrl}
                  videoUrl={checklistCard.videoUrl}
                  cardNumber={0}
                  foilRarity={checklistCard.encounter.card_foil_rarity || 'prism'}
                  cardTheme={globalTheme}
                  onThemeChange={(newTheme) => {
                    setGlobalTheme(newTheme);
                    localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, newTheme);
                    notify(`Applied Finish: ${newTheme.toUpperCase()}`);
                  }}
                  displaySide={activeCardSide}
                />
              </div>
            ) : (
              <div className="text-center p-8 space-y-4 font-mono max-w-sm">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-yellow-500/70 bg-yellow-950/20 text-yellow-400 mx-auto flex items-center justify-center animate-pulse">
                  <RotateCw className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase text-yellow-300">No Checklist Initialized</h3>
                  <p className="text-xs text-zinc-400">
                    Click below to generate and bind Card #00 to your archival register.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncRegister}
                  disabled={isSyncing}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase cursor-pointer shadow-lg active:scale-95"
                >
                  INITIALIZE CARD #00
                </button>
              </div>
            )}
          </div>

          {/* Card Action Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={handleSynthesizeReel}
              disabled={isSynthesizingVideo || !checklistCard}
              className="flex-1 px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/50 font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              title="Generate looping 1990s VHS test broadcast for Card #00"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>{isSynthesizingVideo ? 'RECORDING...' : (checklistCard?.videoUrl ? 'RE-RECORD VHS' : 'RECORD VHS REEL')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/50 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>PRINT REGISTER</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToBinder('cards')}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <FolderArchive className="w-3.5 h-3.5 text-pink-400" />
              <span>OPEN BINDER</span>
            </button>
          </div>
        </div>

        {/* Right Column: Complete 53-Specimen Digital Register */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 p-3.5 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black uppercase text-zinc-100">
                Specimen Census ({filteredRoster.length} of 53 Shown)
              </h2>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterRarity('all')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  filterRarity === 'all' ? 'bg-yellow-400 text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                ALL
              </button>
              <button
                type="button"
                onClick={() => setFilterRarity('secured')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  filterRarity === 'secured' ? 'bg-emerald-500 text-black font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                SECURED ({securedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterRarity('missing')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  filterRarity === 'missing' ? 'bg-red-500 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                MISSING ({53 - securedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterRarity('videos')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  filterRarity === 'videos' ? 'bg-purple-500 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                REELS
              </button>
            </div>
          </div>

          {/* Interactive Specimen Matrix Grid */}
          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl max-h-[620px] overflow-y-auto divide-y divide-zinc-900">
            {filteredRoster.map((item) => (
              <div 
                key={`specimen-row-${item.number}`}
                className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors ${
                  item.isSecured 
                    ? 'hover:bg-zinc-900/60 bg-zinc-950' 
                    : 'bg-black/40 opacity-70 hover:opacity-100 hover:bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${
                    item.isSecured 
                      ? 'bg-yellow-400 text-black shadow-xs' 
                      : 'border border-dashed border-zinc-700 text-zinc-600'
                  }`}>
                    {item.isSecured ? '✓' : item.number}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-cyan-400">
                        #{String(item.number).padStart(2, '0')}
                      </span>
                      <span className={`text-xs sm:text-sm font-bold truncate ${
                        item.isSecured ? 'text-zinc-100' : 'text-zinc-500 italic'
                      }`}>
                        {item.name}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      {item.isSecured ? (
                        <>
                          <span className="text-emerald-400 font-bold">SECURED IN SLEEVE</span>
                          {item.hasVideo && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[9px] flex items-center gap-0.5">
                              <Film className="w-2.5 h-2.5" /> REEL
                            </span>
                          )}
                          {item.location && (
                            <span className="truncate max-w-[200px] text-zinc-400 hidden sm:inline">
                              • {item.location}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-zinc-600">UNRESOLVED ANOMALY IN THE FIELD</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.isSecured ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToBinder('cards')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                      title="View card in Trapper Keeper Binder"
                    >
                      <span>VIEW SLEEVE</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNavigateToRoll}
                      className="px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 border border-pink-700/60 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                      title="Roll a new encounter to capture this specimen"
                    >
                      <Dices className="w-3 h-3 text-pink-400" />
                      <span>ROLL NOW</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Ledger Notice */}
          <div className="p-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <span>Certified Archival Integrity • Series 2 Official 54-Card Ledger</span>
            </div>
            <button
              type="button"
              onClick={handleSyncRegister}
              disabled={isSyncing}
              className="text-yellow-400 hover:underline cursor-pointer font-bold flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>FORCE RE-INDEX</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateChecklistModal 
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        savedCards={allCards}
        onChecklistCreated={() => {
          loadData();
          notify("Master Checklist Customized & Saved!");
        }}
      />

      <PrintableBinderSheetModal 
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        cards={allCards}
        initialSheetNumber={1}
        binderMode="cards"
      />
    </div>
  );
};
