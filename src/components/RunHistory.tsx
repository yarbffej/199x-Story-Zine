import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { CombatEncounter } from '../types';

interface RunHistoryProps {
  history: CombatEncounter[];
  currentIndex: number;
  onSelectEncounter: (index: number) => void;
  onClearHistory: () => void;
}

export const RunHistory: React.FC<RunHistoryProps> = ({
  history,
  currentIndex,
  onSelectEncounter,
  onClearHistory
}) => {
  const [copiedBatch, setCopiedBatch] = useState(false);

  if (history.length <= 1) return null;

  const handleCopyAllPrompts = async () => {
    const formatted = history
      .map((item, idx) => {
        const flowPrompt = item.flow_video_prompt || item.video_generation_prompt;
        return [
          `=== CARD #${idx + 1}: ${item.entity_name} [${(item.card_foil_rarity || 'standard').toUpperCase()}] ===`,
          `[IMAGE PROMPT]:\n${item.visual_generation_prompt}`,
          `[4S VIDEO PROMPT]:\n${flowPrompt}`
        ].join('\n\n');
      })
      .join('\n\n------------------------------------------------------------\n\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2500);
    } catch {}
  };

  return (
    <div id="run-history-container" className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
      {/* Horizontal Card Slot Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1 min-w-0">
        {history.map((item, idx) => {
          const isSelected = idx === currentIndex;
          const threatColor = item.threat_level_color || "#FF007F";

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectEncounter(idx)}
              className={`px-2.5 py-1 rounded-lg border font-mono text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-pink-950/90 border-pink-400 text-white font-bold shadow-sm"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: threatColor }}
              />
              <span className="text-[10px] text-cyan-400 font-bold">#{idx + 1}</span>
              <span className="truncate max-w-[115px]">{item.entity_name}</span>
            </button>
          );
        })}
      </div>

      {/* Compact Prev / Next / Copy All */}
      <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
        <button
          type="button"
          onClick={() => onSelectEncounter(Math.max(0, currentIndex - 1))}
          disabled={currentIndex <= 0}
          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-35 text-zinc-200 border border-zinc-700 cursor-pointer"
          title="Previous Card"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onSelectEncounter(Math.min(history.length - 1, currentIndex + 1))}
          disabled={currentIndex >= history.length - 1}
          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-35 text-zinc-200 border border-zinc-700 cursor-pointer"
          title="Next Card"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleCopyAllPrompts}
          className={`px-2.5 py-1 rounded border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
            copiedBatch
              ? 'bg-emerald-950 border-emerald-400 text-emerald-200'
              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
          }`}
          title="Copy all prompts in this set"
        >
          {copiedBatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-purple-400" />}
          <span>{copiedBatch ? 'Copied Set!' : 'Copy Set Prompts'}</span>
        </button>

        <button
          type="button"
          onClick={onClearHistory}
          className="px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-300 cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
