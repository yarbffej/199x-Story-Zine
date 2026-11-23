import React, { useState } from 'react';
import {
  Dices,
  MapPin,
  Ghost,
  Sword,
  BookOpen,
  RefreshCw,
  FileSpreadsheet,
  User,
  Palette,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock
} from 'lucide-react';
import { retroOptionManager } from '../utils/shuffleBag';
import { getThemeSetById, getThemeSetsForUniverse, isMutableEchoTheme, UniverseId } from '../data/themeSets';
import { StudioUiTheme } from '../data/uiThemes';
import { LibraryManagerModal, TabType } from './LibraryManagerModal';
import { EncounterWheel, WheelSlice } from './EncounterWheel';

interface VariableControlsProps {
  location: string;
  anomaly: string;
  improvisedGear: string;
  character: string;
  heroLocked?: boolean;
  onToggleHeroLocked?: () => void;
  onSwapHero?: () => void;
  onSwapVillain?: () => void;
  onPickVillain?: (villain: string) => void;
  artStyle?: string;
  activeThemeId?: string;
  activeUniverse?: UniverseId;
  uiTheme?: StudioUiTheme;
  onLocationChange: (val: string) => void;
  onAnomalyChange: (val: string) => void;
  onImprovisedGearChange: (val: string) => void;
  onCharacterChange: (val: string) => void;
  onArtStyleChange?: (val: string) => void;
  onSelectThemeSet?: (themeId: string) => void;
  onBatchRollThemeSet?: (themeId: string, count: number) => void;
  onQuickRollSingleCard?: () => void;
  onRandomizeAll: () => void;
  onStartRolling?: () => void;
  onStopRolling?: (slice?: WheelSlice) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isRolling?: boolean;
}

const SHORT_THEME_LABELS: Record<string, string> = {
  'all': 'All Themes',
  'arcade-laser-afterhours': 'Arcade & Laser',
  'vhs-midnight-vault': 'VHS Vault',
  'dead-mall-retail': 'Dead Mall',
  'food-court-mutants': 'Food Court',
  'cyber-56k-glitch': '56k Glitch',
  'cul-de-sac-nightwatch': 'Cul-de-Sac',
  'scholastic-schoolyard': 'Schoolyard',
  'me-all': 'All ME! Nodes',
  'me-iron-chapel': 'Node BB: Iron Chapel',
  'me-silent-lines': 'Node LL: Silent Lines',
  'me-blueprint-woods': 'Node AF33: Woods',
  'me-architect-core': 'Node AZ: Architect',
  'me-chitinous-trenches': 'Chitinous Trench',
  'me-temporal-loops': '4.2s Stutter Loop',
  'me-vitrified-wastes': 'Node AA: Wastes'
};

export const VariableControls: React.FC<VariableControlsProps> = ({
  location,
  anomaly,
  improvisedGear,
  character,
  heroLocked = false,
  onToggleHeroLocked,
  onSwapHero,
  onSwapVillain,
  onPickVillain,
  artStyle = "90s Dark Horse indie graphic novel ink-and-watercolor illustration",
  activeThemeId = 'all',
  activeUniverse,
  uiTheme,
  onLocationChange,
  onAnomalyChange,
  onImprovisedGearChange,
  onCharacterChange,
  onArtStyleChange,
  onSelectThemeSet,
  onBatchRollThemeSet,
  onQuickRollSingleCard,
  onRandomizeAll,
  onStartRolling,
  onStopRolling,
  onGenerate,
  isGenerating,
  isRolling = false
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryInitialTab, setLibraryInitialTab] = useState<TabType>('anomalies');
  const [spinningField, setSpinningField] = useState<string | null>(null);
  const [showWheel, setShowWheel] = useState<boolean>(false);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [isWheelExpanded, setIsWheelExpanded] = useState<boolean>(false);
  const [selectedSlice, setSelectedSlice] = useState<WheelSlice | null>(null);
  const resolvedUniverse: UniverseId = activeUniverse || (isMutableEchoTheme(activeThemeId) ? 'mutable-echo' : '199x');
  const visibleThemes = getThemeSetsForUniverse(resolvedUniverse);
  const activeTheme = getThemeSetById(activeThemeId);

  const handleRollSingle = (field: 'location' | 'anomaly' | 'gear' | 'character' | 'artStyle') => {
    setSpinningField(field);
    setTimeout(() => {
      if (field === 'location') {
        onLocationChange(retroOptionManager.rollLocation(true, activeThemeId));
      } else if (field === 'anomaly') {
        onAnomalyChange(retroOptionManager.rollAnomaly(true, activeThemeId));
      } else if (field === 'character') {
        onCharacterChange(retroOptionManager.rollCharacter(true, activeThemeId));
      } else if (field === 'gear') {
        onImprovisedGearChange(retroOptionManager.rollGear(true, activeThemeId));
      } else if (field === 'artStyle') {
        onArtStyleChange?.(retroOptionManager.rollArtStyle(true, activeThemeId));
      }
      setSpinningField(null);
    }, 180);
  };

  const handleSelectFromLibrary = (category: 'location' | 'anomaly' | 'gear' | 'character' | 'artStyle', value: string) => {
    if (category === 'location') onLocationChange(value);
    if (category === 'anomaly') {
      if (onPickVillain) onPickVillain(value);
      else onAnomalyChange(value);
    }
    if (category === 'character') onCharacterChange(value);
    if (category === 'gear') onImprovisedGearChange(value);
    if (category === 'artStyle') onArtStyleChange?.(value);
  };

  const openLibraryWithTab = (tab: TabType) => {
    setLibraryInitialTab(tab);
    setIsLibraryOpen(true);
  };

  const totalPoolCount =
    retroOptionManager.getLocations().length +
    retroOptionManager.getAnomalies().length +
    retroOptionManager.getCharacters().length +
    retroOptionManager.getArtifacts().length +
    retroOptionManager.getWeapons().length +
    retroOptionManager.getArtStyles().length;

  return (
    <div
      id="variable-controls-card"
      style={{
        backgroundColor: uiTheme?.isDark ? uiTheme.middleBg : undefined,
        borderColor: uiTheme ? uiTheme.borderColor : undefined,
        boxShadow: !uiTheme?.isDark && uiTheme ? `5px 5px 0px ${uiTheme.borderColor}` : undefined,
      }}
      className="bg-zinc-900/95 border-[2.5px] border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3 transition-colors duration-300"
    >
      {/* Compact Single-Row Theme Picker + Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Theme Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {visibleThemes.map((theme) => {
            const isSelected = theme.id === activeThemeId;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onSelectThemeSet?.(theme.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-pink-950/90 border-pink-400 text-white shadow-[0_0_12px_rgba(236,72,153,0.35)]'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
                title={theme.tagline}
              >
                <span>{theme.icon}</span>
                <span>{SHORT_THEME_LABELS[theme.id] || theme.shortBadge}</span>
              </button>
            );
          })}
        </div>

        {/* Main Roll & Customize Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Roll Single Story Issue */}
          <button
            id="randomize-variables-button"
            type="button"
            onClick={() => {
              if (showWheel) {
                if (isRolling) {
                  if (onStopRolling) onStopRolling(selectedSlice || undefined);
                  else onRandomizeAll();
                } else {
                  if (onStartRolling) onStartRolling();
                  else onRandomizeAll();
                }
              } else if (onQuickRollSingleCard) {
                onQuickRollSingleCard();
              } else {
                onRandomizeAll();
              }
            }}
            disabled={isGenerating}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer shadow-md active:scale-95 ${
              isRolling
                ? "bg-red-600 hover:bg-red-500 text-white border-2 border-yellow-300 animate-pulse"
                : "bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 hover:opacity-95 text-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000]"
            }`}
          >
            <Dices className={`w-4 h-4 ${isRolling ? 'text-yellow-300' : 'text-zinc-950'}`} />
            <span>{isRolling ? "🛑 STOP WHEEL" : "Roll New Story"}</span>
          </button>

          {/* Optional Prize Wheel Toggle */}
          <button
            id="toggle-wheel-button"
            type="button"
            onClick={() => setShowWheel(prev => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              showWheel
                ? "bg-purple-950/90 border-purple-400 text-purple-200"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Show/Hide 16-Slice Prize Wheel"
          >
            <span>🎡 Wheel</span>
          </button>

          {/* Optional Customize Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowCustomize(prev => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
              showCustomize
                ? "bg-cyan-950/90 border-cyan-400 text-cyan-200"
                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Edit Location, Anomaly, Hero, Gear, or Database"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit</span>
            {showCustomize ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Pure Bad Guy Focus Strip (100% Bad Guys Only • Zero Human Heroes!) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Bad Guy Pill + Stockpile Browser + Swap */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-950/75 border border-pink-500/40 text-pink-200">
            <Ghost className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="text-[11px] uppercase text-pink-400 font-bold">Bad Guy:</span>
            <span className="font-bold text-white truncate max-w-[200px] sm:max-w-[300px]">
              {anomaly}
            </span>
            <button
              type="button"
              onClick={() => openLibraryWithTab('anomalies')}
              className="ml-0.5 px-1.5 py-0.5 rounded bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400/40 text-[10px] font-bold text-pink-200 hover:text-white cursor-pointer transition-colors"
              title="Browse, search, or add to your 200+ Bad Guy Stockpile"
            >
              {retroOptionManager.getAnomalies('all').length} Stockpile
            </button>
            {onSwapVillain && (
              <button
                type="button"
                onClick={onSwapVillain}
                className="p-1 rounded bg-zinc-900/90 hover:bg-zinc-800 text-pink-300 hover:text-white cursor-pointer"
                title="Swap to a different Bad Guy Monster"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Active Location Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-700/70 text-zinc-200">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-zinc-200 truncate max-w-[180px] sm:max-w-[260px]">
              {location}
            </span>
          </div>
        </div>

        <span className="text-[11px] text-zinc-400 hidden xl:inline">
          100% Bad Guys Only • Zero Human Heroes
        </span>
      </div>

      {/* Optional Prize Wheel Drawer */}
      {showWheel && (
        <div className="p-3 sm:p-4 rounded-xl bg-zinc-950/90 border border-pink-500/40 relative overflow-hidden">
          <EncounterWheel
            isRolling={isRolling}
            onStartRolling={() => {
              if (onStartRolling) onStartRolling();
              else onRandomizeAll();
            }}
            onStopRolling={(slice) => {
              setSelectedSlice(slice);
              if (onStopRolling) onStopRolling(slice);
              else onRandomizeAll();
            }}
            currentSlice={selectedSlice}
            isExpanded={isWheelExpanded}
            onToggleExpand={() => setIsWheelExpanded(prev => !prev)}
          />
        </div>
      )}

      {/* Optional Customize Inputs Drawer (Hidden by default to keep UI clean) */}
      {showCustomize && (
        <div className="pt-3 border-t border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-zinc-400">
              Active Pool: <strong className="text-white">{activeTheme.icon} {activeTheme.name}</strong>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold cursor-pointer"
              >
                {isGenerating ? 'Generating...' : '✨ AI Generate From Inputs'}
              </button>
              <button
                id="quick-upload-spreadsheet-button"
                type="button"
                onClick={() => openLibraryWithTab('spreadsheet')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-yellow-300 border border-yellow-500/40 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel/CSV</span>
              </button>
              <button
                id="open-library-manager-button"
                type="button"
                onClick={() => openLibraryWithTab('anomalies')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Database ({totalPoolCount}+)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Location */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                <span className="flex items-center gap-1 font-bold"><MapPin className="w-3 h-3" /> Location</span>
                <button type="button" onClick={() => handleRollSingle('location')} className="p-0.5 hover:text-white cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${spinningField === 'location' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                id="location-input"
                type="text"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
              />
            </div>

            {/* Anomaly */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-pink-400">
                <span className="flex items-center gap-1 font-bold"><Ghost className="w-3 h-3" /> Anomaly</span>
                <button type="button" onClick={() => handleRollSingle('anomaly')} className="p-0.5 hover:text-white cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${spinningField === 'anomaly' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                id="anomaly-input"
                type="text"
                value={anomaly}
                onChange={(e) => onAnomalyChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
              />
            </div>

            {/* Operative */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                <span className="flex items-center gap-1 font-bold"><User className="w-3 h-3" /> Operative</span>
                <button type="button" onClick={() => handleRollSingle('character')} className="p-0.5 hover:text-white cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${spinningField === 'character' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                id="character-input"
                type="text"
                value={character}
                onChange={(e) => onCharacterChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
              />
            </div>

            {/* Gear */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-yellow-400">
                <span className="flex items-center gap-1 font-bold"><Sword className="w-3 h-3" /> Gear</span>
                <button type="button" onClick={() => handleRollSingle('gear')} className="p-0.5 hover:text-white cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${spinningField === 'gear' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                id="gear-input"
                type="text"
                value={improvisedGear}
                onChange={(e) => onImprovisedGearChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
              />
            </div>

            {/* Art Style */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-purple-400">
                <span className="flex items-center gap-1 font-bold"><Palette className="w-3 h-3" /> Art Style</span>
                <button type="button" onClick={() => handleRollSingle('artStyle')} className="p-0.5 hover:text-white cursor-pointer">
                  <RefreshCw className={`w-3 h-3 ${spinningField === 'artStyle' ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <input
                id="art-style-input"
                type="text"
                value={artStyle}
                onChange={(e) => onArtStyleChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Database / Library Modal */}
      <LibraryManagerModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectOption={handleSelectFromLibrary}
        initialTab={libraryInitialTab}
      />
    </div>
  );
};
