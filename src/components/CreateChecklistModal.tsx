import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  X, 
  ShieldCheck, 
  FileCheck,
  RotateCw,
  PackageOpen
} from 'lucide-react';
import { ArchiveCardRecord, saveCardToArchive } from '../utils/archiveDb';
import { generateMasterChecklistVideoBlob, generateChecklistCardCanvasBlob } from '../utils/checklistGenerator';
import { CombatEncounter, ChecklistItem, CardThemeType } from '../types';
import { playCriticalSmashSound } from '../utils/audio';
import { ChecklistCardFront, generateThemeStyles } from './TradingCardVisual';

interface CreateChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCards: (ArchiveCardRecord & { previewUrl: string; videoUrl?: string })[];
  onChecklistCreated: (checklistRecord: ArchiveCardRecord & { previewUrl: string; videoUrl?: string }) => void;
  targetSlotNumber?: number;
}

export { generateChecklistCardCanvasBlob };

export const CreateChecklistModal: React.FC<CreateChecklistModalProps> = ({
  isOpen,
  onClose,
  savedCards,
  onChecklistCreated
}) => {
  const existingChecklist = useMemo(() => {
    return savedCards.find(c => 
      c.encounter?.card_number === 0 || 
      c.encounter?.card_type === 'checklist' || 
      c.imageName.includes('checklist')
    );
  }, [savedCards]);

  const [title, setTitle] = useState<string>(() => existingChecklist?.encounter?.entity_name || '199X SERIES 2 MASTER CHECKLIST');
  const [subtitle, setSubtitle] = useState<string>(() => existingChecklist?.encounter?.checklist_subtitle || existingChecklist?.encounter?.cosmic_distortion || 'OFFICIAL 54-SPECIMEN ARCHIVAL REGISTER');
  const [theme, setTheme] = useState<CardThemeType>(() => existingChecklist?.encounter?.card_theme || 'prismatic-refractor');
  const [foilRarity, setFoilRarity] = useState<'prism' | 'gold' | 'silver' | 'standard'>(() => existingChecklist?.encounter?.card_foil_rarity || 'prism');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    if (existingChecklist && isOpen) {
      if (existingChecklist.encounter?.entity_name) setTitle(existingChecklist.encounter.entity_name);
      if (existingChecklist.encounter?.card_theme) setTheme(existingChecklist.encounter.card_theme);
      if (existingChecklist.encounter?.card_foil_rarity) setFoilRarity(existingChecklist.encounter.card_foil_rarity);
    }
  }, [existingChecklist, isOpen]);

  // Extract strictly populated cards in ascending numerical order
  const initialItems = useMemo<ChecklistItem[]>(() => {
    const nonChecklist = savedCards.filter(c => 
      c.encounter?.card_type !== 'checklist' && 
      c.encounter?.card_number !== 0 &&
      !c.imageName.includes('checklist')
    );

    return nonChecklist.map((c, idx) => {
      const num = c.encounter?.card_number || (idx + 1);
      return {
        number: num,
        name: c.encounter?.entity_name || `Specimen #${num}`,
        checked: true,
        rarity: c.encounter?.card_foil_rarity || 'standard',
        threatColor: c.encounter?.threat_level_color || '#FF007F',
        status: 'SECURED'
      };
    }).sort((a, b) => a.number - b.number);
  }, [savedCards]);

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(initialItems);

  useEffect(() => {
    setChecklistItems(initialItems);
  }, [initialItems]);

  const previewEncounter = useMemo<CombatEncounter>(() => {
    return {
      entity_name: title,
      cosmic_distortion: subtitle,
      threat_level_color: '#FFE600',
      card_number: 0,
      card_type: 'checklist',
      card_foil_rarity: foilRarity,
      is_foil: true,
      card_theme: theme,
      checklist_items: checklistItems,
      checklist_subtitle: subtitle,
      protagonist_loadout: {
        nostalgia_artifact: 'Trapper Keeper 3-Ring Binder',
        improvised_weapon: 'Ultra PRO 9-Pocket Pages',
        weird_synergy_effect: '100% Series 2 Set Completion Aura'
      },
      combat_ticker: [
        `${checklistItems.length} OF 53 SPECIMENS REGISTERED`,
        'SHEET 1 POCKET 1 PERMANENT CAPSTONE ANCHOR',
        'SERIES 2 OFFICIALLY SECURED'
      ],
      status_affliction: 'ARCHIVE COMPLETE',
      critical_smash: true,
      visual_generation_prompt: '1990s retro trading card checklist, neon yellow and cyan grid, specimen registry',
      video_generation_prompt: ''
    };
  }, [title, subtitle, foilRarity, theme, checklistItems]);

  if (!isOpen) return null;

  const handleCreateAndBind = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveStatus('Rasterizing checklist card (#00)...');

    try {
      const blob = await generateChecklistCardCanvasBlob(previewEncounter, 0, checklistItems);
      setSaveStatus('Synthesizing 4s VHS Master Video Reel...');
      let videoBlob: Blob | undefined;
      try {
        videoBlob = await generateMasterChecklistVideoBlob(title, checklistItems.length);
      } catch (vidErr) {
        console.warn('Video reel synthesis skipped:', vidErr);
      }

      setSaveStatus('Binding Card #00 to Sheet 1, Pocket 1...');

      const record = await saveCardToArchive(
        previewEncounter,
        blob,
        'series-2-master-checklist-card-00.png',
        videoBlob && videoBlob.size > 0 ? videoBlob : undefined,
        videoBlob && videoBlob.size > 0 ? 'series-2-master-checklist-reel.webm' : undefined,
        videoBlob && videoBlob.size > 0 ? 'video' : 'image'
      );

      const previewUrl = URL.createObjectURL(blob);
      const videoUrl = videoBlob && videoBlob.size > 0 ? URL.createObjectURL(videoBlob) : undefined;
      playCriticalSmashSound();
      onChecklistCreated({
        ...record,
        previewUrl,
        videoUrl
      });
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create checklist card:', err);
      setSaveStatus(err instanceof Error ? err.message : 'Error creating card');
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl rounded-3xl bg-zinc-950 border-2 border-yellow-500/70 shadow-[0_0_50px_rgba(234,179,8,0.3)] p-4 sm:p-6 space-y-5 my-auto max-h-[92vh] flex flex-col font-mono text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,230,0,0.6)]">
              <Sparkles className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-500/40">
                  SHEET 1 • POCKET 1 ANCHOR
                </span>
                <span className="text-xs text-zinc-400">CARD #00</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide uppercase">
                CREATE 199X SERIES 2 MASTER CHECKLIST CARD (#00)
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Cataloged Specimens</span>
              <strong className="text-zinc-200">{checklistItems.length} of 53 Recorded</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-yellow-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Zero Phantom Slots</span>
              <strong className="text-yellow-300">Only showing collected cards</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase">Card Slot Anchor</span>
              <strong className="text-cyan-300">Permanent Card #00</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="lg:col-span-5 space-y-4 text-xs">
            <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Card Title (Masthead)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-yellow-300 font-bold focus:border-yellow-400 outline-none text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase">
                Cardstock / Finish Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'prismatic-refractor', label: 'Prism Refractor' },
                  { id: 'gold-embossed', label: 'Gold Embossed' },
                  { id: 'neon-splatter', label: 'Slime Gak' },
                  { id: 'cracked-ice', label: 'Cracked Ice' }
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id as CardThemeType)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-left truncate cursor-pointer ${
                      theme === th.id
                        ? 'bg-yellow-400 text-black border-yellow-300 font-black shadow-sm'
                        : 'bg-black/60 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex-1 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80 overflow-y-auto flex items-center justify-center min-h-[460px]">
              <div className="w-full max-w-sm mx-auto space-y-1">
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block text-center">
                  CARD #00 • SHEET 1, POCKET 1 ANCHOR
                </span>
                <div 
                  className="w-full aspect-[5/7] rounded-2xl p-2.5 shadow-2xl relative overflow-hidden"
                  style={generateThemeStyles(theme, foilRarity, '#FFE600')}
                >
                  <ChecklistCardFront 
                    encounter={previewEncounter}
                    cardNumber={0}
                    foilRarity={foilRarity}
                    threatColor="#FFE600"
                    theme={theme}
                    hideControls={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {saveStatus ? (
              <span className="text-yellow-300 font-bold flex items-center gap-1.5 animate-pulse">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>{saveStatus}</span>
              </span>
            ) : (
              <span>Only displays the {checklistItems.length} active cards in your collection</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700 transition-colors text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-bind-checklist-btn"
              onClick={handleCreateAndBind}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,230,0,0.6)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-black text-black" />
              <span>{isSaving ? 'BINDING...' : '★ BIND CARD #00 TO SHEET 1 ★'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};