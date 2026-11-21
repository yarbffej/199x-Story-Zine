import React, { useState } from 'react';
import { 
  X, Plus, Trash2, BookOpen, Layers, Sparkles, Check, 
  MapPin, Ghost, Sword, Package, RotateCcw, Search, FileText,
  FileSpreadsheet, Upload, Download, AlertTriangle, User, Palette
} from 'lucide-react';
import { retroOptionManager } from '../utils/shuffleBag';
import { SpreadsheetUploader } from './SpreadsheetUploader';

interface LibraryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (category: 'location' | 'anomaly' | 'gear' | 'character' | 'artStyle', value: string) => void;
  initialTab?: TabType;
}

export type TabType = 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear' | 'aesthetics' | 'spreadsheet';

export const LibraryManagerModal: React.FC<LibraryManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  initialTab = 'anomalies'
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [, setForceUpdate] = useState(0);

  if (!isOpen) return null;

  const getItemsForTab = (): { all: string[]; custom: string[] } => {
    const customData = retroOptionManager.getCustomData();
    switch (activeTab) {
      case 'locations':
        return {
          all: retroOptionManager.getLocations(),
          custom: customData.customLocations
        };
      case 'anomalies':
        return {
          all: retroOptionManager.getAnomalies(),
          custom: customData.customAnomalies
        };
      case 'characters':
        return {
          all: retroOptionManager.getCharacters(),
          custom: customData.customCharacters
        };
      case 'artifacts':
        return {
          all: retroOptionManager.getArtifacts(),
          custom: customData.customArtifacts
        };
      case 'weapons':
        return {
          all: retroOptionManager.getWeapons(),
          custom: customData.customWeapons
        };
      case 'gear':
        return {
          all: retroOptionManager.getGearPresets(),
          custom: customData.customGear
        };
      case 'aesthetics':
        return {
          all: retroOptionManager.getArtStyles(),
          custom: customData.customArtStyles || []
        };
      default:
        return { all: [], custom: [] };
    }
  };

  const { all, custom } = getItemsForTab();
  const filtered = all.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customSummary = retroOptionManager.getCustomData();
  const totalCustomCount = 
    customSummary.customLocations.length +
    customSummary.customAnomalies.length +
    customSummary.customCharacters.length +
    customSummary.customArtifacts.length +
    customSummary.customWeapons.length +
    customSummary.customGear.length +
    (customSummary.customArtStyles?.length || 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || activeTab === 'spreadsheet') return;
    const categoryKey = activeTab === 'aesthetics' ? 'artStyles' : activeTab;
    retroOptionManager.addCustomOption(categoryKey, newItemText.trim());
    setNewItemText('');
    setForceUpdate(n => n + 1);
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim() || activeTab === 'spreadsheet') return;
    const categoryKey = activeTab === 'aesthetics' ? 'artStyles' : activeTab;
    const count = retroOptionManager.bulkAddOptions(categoryKey, bulkText);
    setBulkText('');
    setIsBulkMode(false);
    setCopiedNotification(`Added ${count} custom ${activeTab}!`);
    setTimeout(() => setCopiedNotification(null), 3000);
    setForceUpdate(n => n + 1);
  };

  const handleRemoveCustom = (item: string) => {
    if (activeTab === 'spreadsheet') return;
    const categoryKey = activeTab === 'aesthetics' ? 'artStyles' : activeTab;
    retroOptionManager.removeCustomOption(categoryKey, item);
    setForceUpdate(n => n + 1);
  };

  const handleClearAllCustom = () => {
    retroOptionManager.clearCustomData();
    setShowClearConfirm(false);
    setCopiedNotification("Cleared all custom database entries.");
    setTimeout(() => setCopiedNotification(null), 3000);
    setForceUpdate(n => n + 1);
  };

  const handleSelect = (item: string) => {
    if (activeTab === 'locations') {
      onSelectOption('location', item);
    } else if (activeTab === 'anomalies') {
      onSelectOption('anomaly', item);
    } else if (activeTab === 'characters') {
      onSelectOption('character', item);
    } else if (activeTab === 'gear') {
      onSelectOption('gear', item);
    } else if (activeTab === 'aesthetics') {
      onSelectOption('artStyle', item);
    } else if (activeTab === 'artifacts' || activeTab === 'weapons') {
      // Pick random counterpart to form gear
      if (activeTab === 'artifacts') {
        const wpn = retroOptionManager.rollWeapon();
        onSelectOption('gear', `${item} + ${wpn}`);
      } else {
        const art = retroOptionManager.rollArtifact();
        onSelectOption('gear', `${art} + ${item}`);
      }
    }
    setCopiedNotification(`Selected: "${item}"`);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="library-manager-modal"
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 font-mono tracking-tight flex items-center gap-2">
                DATABASE &amp; CUSTOM OPTIONS POOL
              </h3>
              <p className="text-xs text-zinc-400">
                Manage 500+ procedural retro options, upload spreadsheets (.xlsx/.csv), or inject custom entries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => { setActiveTab('anomalies'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'anomalies'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Ghost className="w-3.5 h-3.5 text-pink-400" />
              <span>Anomalies ({retroOptionManager.getAnomalies().length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('locations'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'locations'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Locations ({retroOptionManager.getLocations().length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('characters'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'characters'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Operatives ({retroOptionManager.getCharacters().length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('artifacts'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'artifacts'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Artifacts ({retroOptionManager.getArtifacts().length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('weapons'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'weapons'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Sword className="w-3.5 h-3.5 text-amber-400" />
              <span>Weapons ({retroOptionManager.getWeapons().length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('gear'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'gear'
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-yellow-400" />
              <span>Gear ({retroOptionManager.getGearPresets().length})</span>
            </button>

            <button
              id="aesthetics-library-tab-button"
              onClick={() => { setActiveTab('aesthetics'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'aesthetics'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Aesthetics ({retroOptionManager.getArtStyles().length})</span>
            </button>

            <button
              id="spreadsheet-upload-tab-button"
              onClick={() => { setActiveTab('spreadsheet'); setIsBulkMode(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'bg-gradient-to-r from-pink-500/30 to-yellow-500/30 text-yellow-200 border border-yellow-500/60 shadow-md ring-1 ring-yellow-400/40'
                  : 'bg-zinc-800 text-yellow-300 hover:text-yellow-200 hover:bg-zinc-700/80 border border-yellow-500/30'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-400" />
              <span>Upload Spreadsheet (.xlsx/.csv)</span>
              {totalCustomCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-yellow-400 text-zinc-950 font-black">
                  +{totalCustomCount}
                </span>
              )}
            </button>
          </div>

          {totalCustomCount > 0 && (
            <div className="flex items-center gap-2">
              {showClearConfirm ? (
                <div className="flex items-center gap-1 bg-red-950/60 border border-red-500/50 px-2 py-1 rounded-lg text-[10px] font-mono text-red-300">
                  <span>Clear {totalCustomCount} custom?</span>
                  <button
                    type="button"
                    onClick={handleClearAllCustom}
                    className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Remove all custom uploaded items"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Custom ({totalCustomCount})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Body: Spreadsheet Uploader OR Category List */}
        {activeTab === 'spreadsheet' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <SpreadsheetUploader
              onImportComplete={(summary) => {
                setCopiedNotification(`Imported ${summary.totalAdded} options across all categories!`);
                setTimeout(() => setCopiedNotification(null), 3500);
                setForceUpdate(n => n + 1);
              }}
            />
          </div>
        ) : (
          <>
            {/* Action bar (Search, Add, Bulk Mode Toggle) */}
            <div className="p-4 sm:px-6 bg-zinc-950/40 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${all.length} ${activeTab}...`}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                    isBulkMode
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isBulkMode ? "Single Add Mode" : "Bulk Paste List"}</span>
                </button>

                <button
                  onClick={() => setActiveTab('spreadsheet')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-yellow-300 border border-zinc-700 text-xs font-mono font-semibold transition-all cursor-pointer"
                  title="Upload Excel or CSV file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Spreadsheet</span>
                </button>
              </div>
            </div>

            {/* Bulk Add or Single Add Form */}
            <div className="px-6 py-3 bg-zinc-900/60 border-b border-zinc-800">
              {isBulkMode ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-zinc-400">
                    Paste your custom {activeTab} (one item per line):
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"Suburban Taco Bell drive-thru portal\nAbandoned video store roof\n..."}
                    rows={3}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-400"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleBulkAdd}
                      className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      Import {bulkText.split('\n').filter(l => l.trim()).length} Items into Pool
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddItem} className="flex gap-2">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={`+ Add a new custom ${activeTab.slice(0, -1)}...`}
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-400"
                  />
                  <button
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              )}
            </div>

            {/* Feedback notification toast */}
            {copiedNotification && (
              <div className="bg-cyan-950/80 border-y border-cyan-800/80 px-6 py-2 text-xs font-mono text-cyan-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  {copiedNotification}
                </span>
                <span className="text-[10px] text-cyan-500">Database updated</span>
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 max-h-[45vh]">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 font-mono text-xs">
                  No matches found for "{searchQuery}". Try adding it with the box above or uploading a spreadsheet!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filtered.map((item, idx) => {
                    const isCustom = custom.includes(item);
                    return (
                      <div
                        key={`${item}-${idx}`}
                        className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs font-mono ${
                          isCustom
                            ? 'bg-pink-950/20 border-pink-900/50 hover:border-pink-500 text-pink-200'
                            : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="flex-1 text-left truncate pr-2 hover:text-white"
                          title="Click to load into encounter"
                        >
                          {isCustom && (
                            <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30">
                              CUSTOM
                            </span>
                          )}
                          <span>{item}</span>
                        </button>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleSelect(item)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-pink-600 hover:text-white text-[10px] text-zinc-300 font-bold transition-all cursor-pointer"
                          >
                            Select
                          </button>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustom(item)}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Delete custom option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>
            Total Pool: {
              retroOptionManager.getLocations().length +
              retroOptionManager.getAnomalies().length +
              retroOptionManager.getArtifacts().length +
              retroOptionManager.getWeapons().length +
              retroOptionManager.getGearPresets().length
            } options ({totalCustomCount} custom)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

