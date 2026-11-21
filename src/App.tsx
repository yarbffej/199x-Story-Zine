import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VariableControls } from './components/VariableControls';
import { EncounterDisplay } from './components/EncounterDisplay';
import { RunHistory } from './components/RunHistory';
import { TrapperKeeperArchive } from './components/TrapperKeeperArchive';
import { MasterChecklistTab } from './components/MasterChecklistTab';
import { ZineStudioTab } from './components/ZineStudioTab';
import { PocketZineReader } from './components/PocketZineReader';
import { CombatEncounter, CardThemeType } from './types';
import { retroOptionManager } from './utils/shuffleBag';
import { generateProceduralEncounter, generateThemedCardSetBatch, getNextRotatedThemeSetId } from './engine/procedural';
import { THEME_SETS, MUTABLE_ECHO_THEME_SETS, getThemeSetById, getThemeSetsForUniverse, isMutableEchoTheme, UniverseId } from './data/themeSets';
import { UiThemeId, getUiTheme, getUiThemeCssVars } from './data/uiThemes';
import { ZineIssueData, buildZineIssueFromEncounter } from './engine/zineEngine';
import {
  ZineShelfRecord,
  HydratedZineShelfIssue,
  getAllZineShelfRecords,
  hydrateZineRecord,
} from './utils/zineStorage';
import { WheelSlice } from './components/EncounterWheel';
import { 
  playRetroRoll, 
  playWheelClick,
  setSoundMuted, 
} from './utils/audio';
import { Dices, FolderArchive, Film, CheckSquare, BookOpen } from 'lucide-react';

export default function App() {
  const [initialBootRoll] = useState(() => ({
    location: retroOptionManager.rollLocation(),
    anomaly: retroOptionManager.rollAnomaly(),
    gear: retroOptionManager.rollGear(),
    character: retroOptionManager.rollCharacter(),
    artStyle: retroOptionManager.rollArtStyle(),
  }));
  const [location, setLocation] = useState<string>(initialBootRoll.location);
  const [anomaly, setAnomaly] = useState<string>(initialBootRoll.anomaly);
  const [improvisedGear, setImprovisedGear] = useState<string>(initialBootRoll.gear);
  const [character, setCharacter] = useState<string>(initialBootRoll.character);
  const [heroLocked, setHeroLocked] = useState<boolean>(false);
  const [artStyle, setArtStyle] = useState<string>(initialBootRoll.artStyle);
  const [activeUniverse, setActiveUniverse] = useState<UniverseId>('199x');
  const [activeThemeId, setActiveThemeId] = useState<string>('all');

  // Active encounter state
  const [currentEncounter, setCurrentEncounter] = useState<CombatEncounter>(() => {
    return generateProceduralEncounter({
      location: initialBootRoll.location,
      anomaly: initialBootRoll.anomaly,
      improvised_gear: initialBootRoll.gear,
      character: initialBootRoll.character,
      art_style: initialBootRoll.artStyle
    });
  });

  const [history, setHistory] = useState<CombatEncounter[]>(() => [currentEncounter]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [soundMuted, setSoundMutedState] = useState<boolean>(false);

  // Zine-First top-level tabs: 'zine' (default!), 'shelf', 'encounter', 'cards', 'videos', or 'checklist'
  const [viewMode, setViewMode] = useState<'zine' | 'shelf' | 'encounter' | 'cards' | 'videos' | 'checklist'>('zine');
  const [showBonusCardTabs, setShowBonusCardTabs] = useState<boolean>(false);

  // Full-canvas Backdrop UI Theme (persisted in localStorage, defaulting to Pop-Zine)
  const [uiThemeId, setUiThemeId] = useState<UiThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('199x_zine_backdrop_theme') as UiThemeId | null;
      if (saved) return saved;
    }
    return 'pop-zine';
  });
  const uiTheme = getUiTheme(uiThemeId);

  const handleSelectUiTheme = (nextId: UiThemeId) => {
    setUiThemeId(nextId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('199x_zine_backdrop_theme', nextId);
    }
  };

  // Zine Shelf IndexedDB state
  const [shelfRecords, setShelfRecords] = useState<ZineShelfRecord[]>([]);
  const [hydratedShelfIssues, setHydratedShelfIssues] = useState<ZineIssueData[]>([]);
  const hydratedCleanupsRef = useRef<Array<() => void>>([]);
  const [liveZineDraft, setLiveZineDraft] = useState<ZineIssueData | null>(null);

  const refreshZineShelf = async () => {
    try {
      const records = await getAllZineShelfRecords();
      hydratedCleanupsRef.current.forEach((fn) => fn());
      const hydratedList: HydratedZineShelfIssue[] = records.map((r) => hydrateZineRecord(r));
      hydratedCleanupsRef.current = hydratedList.map((h) => h.revokeUrls);
      setShelfRecords(records);
      setHydratedShelfIssues(hydratedList.map((h) => h.issue));
    } catch (err) {
      console.warn('Zine shelf load warning:', err);
    }
  };

  useEffect(() => {
    refreshZineShelf();
    return () => {
      hydratedCleanupsRef.current.forEach((fn) => fn());
    };
  }, []);

  // Automatic Mobile Pocket Zine Reader (< 768px or ?reader=1)
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });
  const [readerOverride, setReaderOverride] = useState<'auto' | 'force-reader' | 'force-studio'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reader') === '1') return 'force-reader';
    }
    return 'auto';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobileScreen(e.matches);
    setIsMobileScreen(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Snap window to the very top whenever the top tab is switched
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [viewMode]);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setSoundMuted(next);
  };

  const lastBatchRolledThemeRef = useRef<string>('');
  const spinTickRef = useRef<number>(0);

  const dispatchCardFinishChange = (finish?: CardThemeType) => {
    if (finish && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('199x-theme-changed', { detail: finish }));
    }
  };

  const handleSwitchUniverse = (nextUniverse: UniverseId) => {
    setActiveUniverse(nextUniverse);
    const defaultThemeId = nextUniverse === 'mutable-echo' ? 'me-all' : 'all';
    handleSelectThemeSet(defaultThemeId);
  };

  const handleSelectThemeSet = (themeId: string) => {
    const nextUniverse: UniverseId = isMutableEchoTheme(themeId) ? 'mutable-echo' : '199x';
    setActiveUniverse(nextUniverse);
    setActiveThemeId(themeId);
    retroOptionManager.setActiveThemeId(themeId);
    playRetroRoll();

    const nextLoc = retroOptionManager.rollLocation(true, themeId);
    const nextAnom = retroOptionManager.rollAnomaly(true, themeId);
    const nextGear = retroOptionManager.rollGear(true, themeId);
    const nextChar = heroLocked ? character : retroOptionManager.rollCharacter(true, themeId);
    const nextStyle = retroOptionManager.rollArtStyle(true, themeId);

    setLocation(nextLoc);
    setAnomaly(nextAnom);
    setImprovisedGear(nextGear);
    if (!heroLocked) setCharacter(nextChar);
    setArtStyle(nextStyle);

    const rolled = generateProceduralEncounter({
      location: nextLoc,
      anomaly: nextAnom,
      improvised_gear: nextGear,
      character: nextChar,
      art_style: nextStyle,
      theme_set_id: themeId
    });

    dispatchCardFinishChange(rolled.card_theme);
    setCurrentEncounter(rolled);
    setHistory(prev => [rolled, ...prev].slice(0, 20));
    setHistoryIndex(0);
  };

  const handleBatchRollThemeSet = (themeId: string, count: number = 9) => {
    if (isRolling || isGenerating) return;

    const isME = isMutableEchoTheme(themeId) || activeUniverse === 'mutable-echo';
    const baseThemeId = isME && !isMutableEchoTheme(themeId) ? 'me-all' : themeId;

    // If on 'all' / 'me-all' or clicking Batch Roll again on the same theme, rotate to the next Theme Set!
    const targetThemeId =
      baseThemeId === 'all' || baseThemeId === 'me-all' || lastBatchRolledThemeRef.current === baseThemeId
        ? getNextRotatedThemeSetId(baseThemeId)
        : baseThemeId;
    lastBatchRolledThemeRef.current = targetThemeId;

    const specificThemes = (isME ? MUTABLE_ECHO_THEME_SETS : THEME_SETS).filter(
      t => t.id !== 'all' && t.id !== 'me-all'
    );
    let step = 0;
    const totalSteps = 8;

    playRetroRoll();
    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

    // Rapidly rotate through the themes visually before locking onto targetThemeId
    rollIntervalRef.current = setInterval(() => {
      step++;
      const previewTheme = specificThemes[step % specificThemes.length];
      if (step < totalSteps && previewTheme) {
        setActiveThemeId(previewTheme.id);
        setLocation(retroOptionManager.rollLocation(false, previewTheme.id));
        setAnomaly(retroOptionManager.rollAnomaly(false, previewTheme.id));
        setCharacter(retroOptionManager.rollCharacter(false, previewTheme.id));
        setImprovisedGear(retroOptionManager.rollGear(false, previewTheme.id));
        const previewFinish = previewTheme.cardThemes[step % previewTheme.cardThemes.length];
        dispatchCardFinishChange(previewFinish);
        playWheelClick(720 + (step % 5) * 65);
      } else {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        setActiveThemeId(targetThemeId);
        retroOptionManager.setActiveThemeId(targetThemeId);

        const batch = generateThemedCardSetBatch(targetThemeId, count);
        if (batch.length > 0) {
          const first = batch[0];
          dispatchCardFinishChange(first.card_theme);
          setCurrentEncounter(first);
          setHistory(batch);
          setHistoryIndex(0);
          if (first.location) setLocation(first.location);
          if (first.card_type === 'bad_guy') setAnomaly(first.entity_name);
          if (first.featured_character) setCharacter(first.featured_character);
          if (first.protagonist_loadout) {
            setImprovisedGear(`${first.protagonist_loadout.nostalgia_artifact} + ${first.protagonist_loadout.improvised_weapon}`);
          }
          if (first.visual_style) setArtStyle(first.visual_style);
        }
      }
    }, 55);
  };

  const handleStartRolling = () => {
    if (isRolling || isGenerating) return;
    setIsRolling(true);
    playRetroRoll();

    if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);

    const specificThemes = getThemeSetsForUniverse(activeUniverse).filter(
      t => t.id !== 'all' && t.id !== 'me-all'
    );

    // Continuous spin: rotate Theme Sets, Card Finishes, and all 5 inputs until user hits stop!
    rollIntervalRef.current = setInterval(() => {
      spinTickRef.current++;
      const rotatingTheme = specificThemes[spinTickRef.current % specificThemes.length];
      const themeIdToUse = rotatingTheme ? rotatingTheme.id : activeThemeId;

      setActiveThemeId(themeIdToUse);
      setLocation(retroOptionManager.rollLocation(false, themeIdToUse));
      setAnomaly(retroOptionManager.rollAnomaly(false, themeIdToUse));
      setImprovisedGear(retroOptionManager.rollGear(false, themeIdToUse));
      if (!heroLocked) {
        setCharacter(retroOptionManager.rollCharacter(false, themeIdToUse));
      }
      setArtStyle(retroOptionManager.rollArtStyle(false, themeIdToUse));

      if (rotatingTheme) {
        const rotatingFinish = rotatingTheme.cardThemes[spinTickRef.current % rotatingTheme.cardThemes.length];
        dispatchCardFinishChange(rotatingFinish);
      }
    }, 65);
  };

  const handleStopRolling = (winningSlice?: WheelSlice) => {
    if (!isRolling) return;
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }

    // Map winning wheel slice to its matching 199X Theme Set and Card Finish
    const SLICE_TO_THEME_MAP: Record<string, { themeId: string; finish: CardThemeType }> = {
      'mall-arcade': { themeId: 'arcade-laser-afterhours', finish: 'synthwave-grid' },
      'roller-rink': { themeId: 'arcade-laser-afterhours', finish: 'holo-diffraction' },
      'toxic-ooze': { themeId: 'food-court-mutants', finish: 'toxic-ooze' },
      'pcb-circuit': { themeId: 'cyber-56k-glitch', finish: 'cyber-pcb' },
      'cosmic-abduction': { themeId: 'cul-de-sac-nightwatch', finish: 'cosmic-nebula' },
      'fleer-gold': { themeId: 'dead-mall-retail', finish: 'gold-embossed' },
      'vhs-glitch': { themeId: 'vhs-midnight-vault', finish: 'vhs-static' },
      'jazz-cup': { themeId: 'dead-mall-retail', finish: 'jazz-cup' },
      'pizza-hut': { themeId: 'food-court-mutants', finish: 'memphis-rad' },
      'prism-refractor': { themeId: 'scholastic-schoolyard', finish: 'cracked-ice' },
      'blockbuster': { themeId: 'vhs-midnight-vault', finish: 'atomic-purple' },
      'laser-tag': { themeId: 'arcade-laser-afterhours', finish: 'laser-backdrop' },
      'critical-smash': { themeId: 'cul-de-sac-nightwatch', finish: 'liquid-chrome' },
      'hypercolor': { themeId: 'dead-mall-retail', finish: 'hypercolor-thermal' },
      'pixel-matrix': { themeId: 'cyber-56k-glitch', finish: 'cyber-pcb' },
      'school-lasers': { themeId: 'scholastic-schoolyard', finish: 'laser-backdrop' }
    };

    const mapped = winningSlice ? SLICE_TO_THEME_MAP[winningSlice.id] : undefined;
    const finalThemeId = mapped?.themeId || (activeThemeId === 'all' ? getNextRotatedThemeSetId(activeThemeId) : activeThemeId);

    setActiveThemeId(finalThemeId);
    retroOptionManager.setActiveThemeId(finalThemeId);

    const finalLoc = retroOptionManager.rollLocation(true, finalThemeId);
    const finalAnom = retroOptionManager.rollAnomaly(true, finalThemeId);
    const finalGear = retroOptionManager.rollGear(true, finalThemeId);
    const finalChar = heroLocked ? character : retroOptionManager.rollCharacter(true, finalThemeId);
    const finalStyle = retroOptionManager.rollArtStyle(true, finalThemeId);

    setLocation(finalLoc);
    setAnomaly(finalAnom);
    setImprovisedGear(finalGear);
    if (!heroLocked) setCharacter(finalChar);
    setArtStyle(finalStyle);
    setIsRolling(false);

    const rolledEncounter = generateProceduralEncounter({
      location: finalLoc,
      anomaly: finalAnom,
      improvised_gear: finalGear,
      character: finalChar,
      art_style: finalStyle,
      theme_set_id: finalThemeId,
      forcedCardTheme: mapped?.finish
    });

    if (winningSlice) {
      const themeDef = getThemeSetById(finalThemeId);
      rolledEncounter.combat_ticker = [
        `WHEEL SPOT HIT: ${winningSlice.icon} ${winningSlice.name} → ${themeDef.shortBadge}`,
        `SECTOR VIBE: ${winningSlice.vibe}`,
        `OMEGA THREAT: ${winningSlice.threatLevel}`
      ];
      rolledEncounter.status_affliction = `WHEEL SPOT: ${winningSlice.name}`;
      rolledEncounter.threat_level_color = winningSlice.threatColor;
    }

    dispatchCardFinishChange(rolledEncounter.card_theme);
    setCurrentEncounter(rolledEncounter);
    setHistory(prev => [rolledEncounter, ...prev].slice(0, 20));
    setHistoryIndex(0);
  };

  const handleQuickRollSingleCard = () => {
    if (isRolling || isGenerating) return;
    playRetroRoll();

    // If on 'all' or 'me-all', rotate to the next curated Theme Set on each single roll; otherwise stay in the chosen theme set
    const targetThemeId =
      activeThemeId === 'all' || activeThemeId === 'me-all'
        ? getNextRotatedThemeSetId(activeThemeId)
        : activeThemeId;

    if (activeThemeId !== 'all' && activeThemeId !== 'me-all') {
      retroOptionManager.setActiveThemeId(targetThemeId);
    }

    const nextLoc = retroOptionManager.rollLocation(true, targetThemeId);
    const nextAnom = retroOptionManager.rollAnomaly(true, targetThemeId);
    const nextGear = retroOptionManager.rollGear(true, targetThemeId);
    const nextChar = heroLocked ? character : retroOptionManager.rollCharacter(true, targetThemeId);
    const nextStyle = retroOptionManager.rollArtStyle(true, targetThemeId);

    setLocation(nextLoc);
    setAnomaly(nextAnom);
    setImprovisedGear(nextGear);
    if (!heroLocked) setCharacter(nextChar);
    setArtStyle(nextStyle);

    const rolled = generateProceduralEncounter({
      location: nextLoc,
      anomaly: nextAnom,
      improvised_gear: nextGear,
      character: nextChar,
      art_style: nextStyle,
      theme_set_id: targetThemeId
    });

    dispatchCardFinishChange(rolled.card_theme);
    setCurrentEncounter(rolled);
    setHistory(prev => [rolled, ...prev].slice(0, 20));
    setHistoryIndex(0);
  };

  const handleSwapHeroOnly = () => {
    if (isRolling || isGenerating) return;
    playRetroRoll();
    const nextChar = retroOptionManager.rollCharacter(true, activeThemeId);
    setCharacter(nextChar);
    const updated = generateProceduralEncounter({
      location,
      anomaly,
      improvised_gear: improvisedGear,
      character: nextChar,
      art_style: artStyle,
      theme_set_id: activeThemeId,
    });
    dispatchCardFinishChange(updated.card_theme);
    setCurrentEncounter(updated);
    setHistory(prev => [updated, ...prev].slice(0, 20));
    setHistoryIndex(0);
  };

  const handleSwapVillainOnly = () => {
    if (isRolling || isGenerating) return;
    playRetroRoll();
    const nextAnom = retroOptionManager.rollAnomaly(true, activeThemeId);
    setAnomaly(nextAnom);
    const updated = generateProceduralEncounter({
      location,
      anomaly: nextAnom,
      improvised_gear: improvisedGear,
      character,
      art_style: artStyle,
      theme_set_id: activeThemeId,
    });
    dispatchCardFinishChange(updated.card_theme);
    setCurrentEncounter(updated);
    setHistory(prev => [updated, ...prev].slice(0, 20));
    setHistoryIndex(0);
  };

  const handleRandomizeAll = () => {
    if (isRolling) {
      handleStopRolling();
    } else {
      handleStartRolling();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    playRetroRoll();

    try {
      const res = await fetch("/api/encounter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          anomaly,
          improvised_gear: improvisedGear,
          character,
          art_style: artStyle,
          theme_set_id: activeThemeId
        })
      });

      if (!res.ok) throw new Error(`Encounter generation HTTP ${res.status}`);
      const data: CombatEncounter = await res.json();
      dispatchCardFinishChange(data.card_theme);
      setCurrentEncounter(data);
      setHistory(prev => [data, ...prev].slice(0, 20));
      setHistoryIndex(0);
    } catch (err) {
      console.warn("Using offline procedural generator fallback:", err);
      const fallback = generateProceduralEncounter({
        location,
        anomaly,
        improvised_gear: improvisedGear,
        character,
        art_style: artStyle,
        theme_set_id: activeThemeId
      });
      dispatchCardFinishChange(fallback.card_theme);
      setCurrentEncounter(fallback);
      setHistory(prev => [fallback, ...prev].slice(0, 20));
      setHistoryIndex(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectFromHistory = (index: number) => {
    setHistoryIndex(index);
    const chosen = history[index];
    if (chosen) {
      dispatchCardFinishChange(chosen.card_theme);
      if (chosen.theme_set_id) setActiveThemeId(chosen.theme_set_id);
      setCurrentEncounter(chosen);
      if (chosen.location) setLocation(chosen.location);
      if (chosen.card_type === 'bad_guy') setAnomaly(chosen.entity_name);
      if (chosen.featured_character) setCharacter(chosen.featured_character);
      if (chosen.protagonist_loadout) {
        setImprovisedGear(`${chosen.protagonist_loadout.nostalgia_artifact} + ${chosen.protagonist_loadout.improvised_weapon}`);
      }
      if (chosen.visual_style) setArtStyle(chosen.visual_style);
    }
  };

  const handleClearHistory = () => {
    setHistory([currentEncounter]);
    setHistoryIndex(0);
  };

  // Always start out with the Zine Creator unless Pocket Reader is explicitly opened
  const showPocketReader = readerOverride === 'force-reader';

  // Build combined issues rack for Pocket Zine Reader (saved shelf + live current encounter if not already saved)
  const pocketReaderIssues: ZineIssueData[] = React.useMemo(() => {
    const activeDraft =
      liveZineDraft || buildZineIssueFromEncounter(currentEncounter, shelfRecords.length + 1);
    const alreadySaved = hydratedShelfIssues.some(
      (s) =>
        s.id === activeDraft.id ||
        s.title.trim().toLowerCase() === activeDraft.title.trim().toLowerCase()
    );
    return alreadySaved
      ? hydratedShelfIssues
      : [activeDraft, ...hydratedShelfIssues];
  }, [liveZineDraft, currentEncounter, hydratedShelfIssues, shelfRecords.length]);

  if (showPocketReader) {
    return (
      <div style={getUiThemeCssVars(uiTheme)}>
        <PocketZineReader
          issues={pocketReaderIssues}
          uiTheme={uiTheme}
          onSelectUiTheme={handleSelectUiTheme}
          onRefreshShelf={refreshZineShelf}
          onExitReader={() => setReaderOverride('force-studio')}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...getUiThemeCssVars(uiTheme),
        backgroundColor: uiTheme.bgColor,
        backgroundImage: uiTheme.bgImage,
        backgroundSize: uiTheme.bgSize,
        color: uiTheme.canvasText,
      }}
      className={`min-h-screen font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden transition-colors duration-300 ${
        crtEnabled && uiTheme.isDark ? "crt-flicker" : ""
      }`}
    >
      {crtEnabled && uiTheme.isDark && (
        <div className="crt-scanlines fixed inset-0 z-50 pointer-events-none opacity-35" />
      )}

      <Header 
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        encounterCount={history.length}
        criticalCount={history.filter(h => h.critical_smash).length}
        isGenerating={isGenerating}
        uiTheme={uiTheme}
        onSelectUiTheme={handleSelectUiTheme}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 space-y-4">
        {/* Zine-First Top Navigation */}
        <div
          style={{
            backgroundColor: uiTheme.middleBg,
            borderColor: uiTheme.borderColor,
            boxShadow: !uiTheme.isDark ? `5px 5px 0px ${uiTheme.borderColor}` : undefined,
          }}
          className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl border-[2.5px] backdrop-blur-sm transition-colors duration-300"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="tab-zine-issue-view"
              onClick={() => setViewMode('zine')}
              className={`px-4 py-2 rounded-xl border-2 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'zine'
                  ? "bg-[#FFE600] border-black text-zinc-950 shadow-[3px_3px_0px_#000]"
                  : "bg-zinc-900/90 border-zinc-700 text-yellow-300 hover:bg-zinc-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. Current Story Zine</span>
            </button>

            <button
              type="button"
              id="tab-zine-shelf-view"
              onClick={() => setViewMode('shelf')}
              className={`px-4 py-2 rounded-xl border-2 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                viewMode === 'shelf'
                  ? "bg-[#FF2A85] border-black text-white shadow-[3px_3px_0px_#000]"
                  : "bg-zinc-900/90 border-zinc-700 text-pink-300 hover:bg-zinc-800"
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>2. Saved Zine Shelf ({shelfRecords.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(showBonusCardTabs || (viewMode !== 'zine' && viewMode !== 'shelf')) && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode('encounter')}
                  className={`px-3 py-1.5 rounded-xl border-2 font-mono text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'encounter'
                      ? "bg-gradient-to-r from-pink-600 to-purple-600 border-black text-white shadow-[3px_3px_0px_#000]"
                      : "bg-zinc-900/85 border-zinc-700 text-zinc-300 hover:text-white"
                  }`}
                >
                  <Dices className="w-3.5 h-3.5 text-pink-300" />
                  <span>Card Studio</span>
                </button>

                <button
                  type="button"
                  id="tab-trapper-keeper-front"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-xl border-2 font-mono text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'cards'
                      ? "bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 border-black text-white shadow-[3px_3px_0px_#000]"
                      : "bg-zinc-900/85 border-zinc-700 text-zinc-300 hover:text-purple-300"
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  <span>Binder (Front)</span>
                </button>

                <button
                  type="button"
                  id="tab-trapper-keeper-back"
                  onClick={() => setViewMode('videos')}
                  className={`px-3 py-1.5 rounded-xl border-2 font-mono text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'videos'
                      ? "bg-gradient-to-r from-pink-700 via-purple-700 to-cyan-700 border-black text-white shadow-[3px_3px_0px_#000]"
                      : "bg-zinc-900/85 border-zinc-700 text-zinc-300 hover:text-pink-300"
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5 text-pink-400" />
                  <span>Binder (Back)</span>
                </button>

                <button
                  type="button"
                  id="tab-master-checklist"
                  onClick={() => setViewMode('checklist')}
                  className={`px-3 py-1.5 rounded-xl border-2 font-mono text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'checklist'
                      ? "bg-gradient-to-r from-amber-600 to-yellow-500 border-black text-zinc-950 shadow-[3px_3px_0px_#000]"
                      : "bg-zinc-900/85 border-zinc-700 text-zinc-300 hover:text-yellow-300"
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Checklist</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (viewMode !== 'zine' && viewMode !== 'shelf') {
                  setViewMode('zine');
                  setShowBonusCardTabs(false);
                } else {
                  setShowBonusCardTabs((prev) => !prev);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl border font-mono text-[11px] font-bold bg-zinc-900/75 border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
              title="Show or hide optional single-card & binder views"
            >
              {showBonusCardTabs || (viewMode !== 'zine' && viewMode !== 'shelf')
                ? '✕ Hide Card Tools'
                : '🃏 Bonus Card Tools'}
            </button>
          </div>
        </div>

        {/* Single-Story Roll Bar on Zine Issue (no multi-card strip!) */}
        {(viewMode === 'zine' || viewMode === 'encounter') && (
          <div className="space-y-4">
            <VariableControls 
              location={location}
              anomaly={anomaly}
              improvisedGear={improvisedGear}
              character={character}
              heroLocked={heroLocked}
              onToggleHeroLocked={() => setHeroLocked((prev) => !prev)}
              onSwapHero={handleSwapHeroOnly}
              onSwapVillain={handleSwapVillainOnly}
              artStyle={artStyle}
              activeThemeId={activeThemeId}
              activeUniverse={activeUniverse}
              uiTheme={uiTheme}
              onLocationChange={setLocation}
              onAnomalyChange={setAnomaly}
              onImprovisedGearChange={setImprovisedGear}
              onCharacterChange={setCharacter}
              onArtStyleChange={setArtStyle}
              onSelectThemeSet={handleSelectThemeSet}
              onBatchRollThemeSet={handleBatchRollThemeSet}
              onRandomizeAll={handleRandomizeAll}
              onQuickRollSingleCard={handleQuickRollSingleCard}
              onStartRolling={handleStartRolling}
              onStopRolling={handleStopRolling}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              isRolling={isRolling}
            />

            {viewMode === 'encounter' && (
              <RunHistory 
                history={history}
                currentIndex={historyIndex}
                onSelectEncounter={handleSelectFromHistory}
                onClearHistory={handleClearHistory}
              />
            )}
          </div>
        )}

        {/* ZINE ISSUE VIEW & ZINE SHELF (PRIMARY) */}
        {(viewMode === 'zine' || viewMode === 'shelf') && (
          <ZineStudioTab
            encounter={currentEncounter}
            uiTheme={uiTheme}
            shelfRecords={shelfRecords}
            hydratedShelfIssues={hydratedShelfIssues}
            onRefreshShelf={refreshZineShelf}
            onOpenPocketReader={() => setReaderOverride('force-reader')}
            onLiveDraftChange={setLiveZineDraft}
            activeSubTab={viewMode === 'shelf' ? 'shelf' : 'builder'}
            onSubTabChange={(sub) => setViewMode(sub === 'shelf' ? 'shelf' : 'zine')}
          />
        )}

        {/* BONUS CARD STUDIO */}
        {viewMode === 'encounter' && (
          <div className="w-full">
            <EncounterDisplay 
              encounter={currentEncounter} 
              uiTheme={uiTheme}
              onSavedToBinder={(targetTab) => setViewMode(targetTab || 'cards')}
              onOpenZineView={() => setViewMode('zine')}
            />
          </div>
        )}

        {/* Tab 3: TRAPPER KEEPER (CARDS) */}
        {viewMode === 'cards' && (
          <TrapperKeeperArchive 
            key="binder-cards"
            binderMode="cards"
            currentEncounter={currentEncounter} 
            onNavigateToRoll={() => setViewMode('encounter')}
            onNavigateToChecklist={() => setViewMode('checklist')}
          />
        )}

        {/* Tab 4: VIDEO REEL BINDER */}
        {viewMode === 'videos' && (
          <TrapperKeeperArchive 
            key="binder-videos"
            binderMode="videos"
            currentEncounter={currentEncounter} 
            onNavigateToRoll={() => setViewMode('encounter')}
            onNavigateToChecklist={() => setViewMode('checklist')}
          />
        )}

        {/* Tab 5: MASTER CHECKLIST TAB */}
        {viewMode === 'checklist' && (
          <MasterChecklistTab 
            onNavigateToBinder={(mode) => setViewMode(mode || 'cards')}
            onNavigateToRoll={() => setViewMode('encounter')}
          />
        )}
      </main>

      <footer
        style={{ borderColor: uiTheme.borderColor, color: uiTheme.canvasMuted }}
        className="border-t py-6 mt-12 text-center font-mono text-xs"
      >
        <p>199X SUBURBAN COSMIC CARD &amp; NEO-POP ZINE ENGINE • 56K DIAL-UP READY • TRAPPER KEEPER &amp; ZINE SHELF COMPATIBLE</p>
      </footer>
    </div>
  );
}