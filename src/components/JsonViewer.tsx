import React, { useState } from 'react';
import { Copy, Check, Download, Code2, Terminal } from 'lucide-react';
import { CombatEncounter } from '../types';

interface JsonViewerProps {
  encounter: CombatEncounter;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ encounter }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showCurl, setShowCurl] = useState<boolean>(false);

  const jsonString = JSON.stringify(encounter, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encounter-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Schema checklist verification
  const schemaChecks = [
    { key: "entity_name", valid: typeof encounter.entity_name === 'string' && encounter.entity_name.length > 0 },
    { key: "cosmic_distortion", valid: typeof encounter.cosmic_distortion === 'string' && encounter.cosmic_distortion.length > 0 },
    { key: "threat_level_color", valid: typeof encounter.threat_level_color === 'string' && encounter.threat_level_color.startsWith('#') },
    { 
      key: "protagonist_loadout", 
      valid: Boolean(
        encounter.protagonist_loadout &&
        encounter.protagonist_loadout.nostalgia_artifact &&
        encounter.protagonist_loadout.improvised_weapon &&
        encounter.protagonist_loadout.weird_synergy_effect
      ) 
    },
    { key: "combat_ticker (3 items)", valid: Array.isArray(encounter.combat_ticker) && encounter.combat_ticker.length === 3 },
    { key: "status_affliction", valid: typeof encounter.status_affliction === 'string' && encounter.status_affliction.length > 0 },
    { key: "critical_smash", valid: typeof encounter.critical_smash === 'boolean' },
    { key: "visual_generation_prompt", valid: typeof encounter.visual_generation_prompt === 'string' && encounter.visual_generation_prompt.length > 0 }
  ];

  const allValid = schemaChecks.every(c => c.valid);

  return (
    <div id="json-viewer-container" className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
      
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
            RAW ENGINE OUTPUT // PURE JSON
          </h3>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            allValid 
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60" 
              : "bg-amber-950/60 text-amber-300 border-amber-700/60"
          }`}>
            {allValid ? "SCHEMA VERIFIED (100%)" : "CHECKING SCHEMA"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-curl-button"
            type="button"
            onClick={() => setShowCurl(!showCurl)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-yellow-400" />
            <span>{showCurl ? "Hide API" : "cURL / API"}</span>
          </button>

          <button
            id="copy-json-button"
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-xs font-mono border border-cyan-700/60 transition-colors active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY JSON</span>
              </>
            )}
          </button>

          <button
            id="download-json-button"
            type="button"
            onClick={handleDownload}
            title="Download JSON file"
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional cURL snippet */}
      {showCurl && (
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
          <span className="text-zinc-500 font-bold block"># Direct API endpoint call:</span>
          <pre className="text-cyan-300 overflow-x-auto whitespace-pre-wrap">
{`curl -X POST http://localhost:3000/api/encounter \\
  -H "Content-Type: application/json" \\
  -d '{"location":"KB Toys","anomaly":"Sentient Fun-Pack Slime","improvised_gear":"Talkboy + Bat"}'`}
          </pre>
        </div>
      )}

      {/* Syntax highlighted JSON code block */}
      <div className="relative rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden font-mono text-xs">
        <div className="p-4 overflow-x-auto max-h-[360px] text-zinc-200">
          <pre id="json-raw-output" className="leading-relaxed">
            {jsonString}
          </pre>
        </div>
      </div>

      {/* Schema checklist */}
      <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-zinc-400">
        <span className="text-zinc-500">Schema Keys:</span>
        {schemaChecks.map(item => (
          <span key={item.key} className="flex items-center gap-1">
            <span className={item.valid ? "text-emerald-400" : "text-red-400"}>
              {item.valid ? "✓" : "✗"}
            </span>
            <span>{item.key}</span>
          </span>
        ))}
      </div>

    </div>
  );
};
