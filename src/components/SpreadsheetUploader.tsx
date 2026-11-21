import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, Check, AlertCircle, 
  MapPin, Ghost, Sparkles, Sword, Package, Trash2, ArrowRight,
  FileText, HelpCircle, RefreshCw, Link2, Copy, ExternalLink,
  ChevronDown, ChevronUp, Globe
} from 'lucide-react';
import { 
  parseSpreadsheetFile, 
  parseSpreadsheetFromText,
  fetchAndParseGoogleSheetUrl,
  commitParsedSpreadsheet, 
  generateSampleExcelWorkbook, 
  generateSampleCsv,
  exportCurrentDatabaseToExcel,
  ParsedSpreadsheetResult
} from '../utils/spreadsheetHelper';

interface SpreadsheetUploaderProps {
  onImportComplete?: (summary: { totalAdded: number; locations: number; anomalies: number; artifacts: number; weapons: number; gear: number }) => void;
  targetCategoryHint?: 'locations' | 'anomalies' | 'artifacts' | 'weapons' | 'gear';
}

type InputMode = 'google-sheet-url' | 'paste-cells' | 'file-upload';

export const SpreadsheetUploader: React.FC<SpreadsheetUploaderProps> = ({
  onImportComplete,
  targetCategoryHint
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>('google-sheet-url');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSpreadsheetResult | null>(null);
  const [unclassifiedTarget, setUnclassifiedTarget] = useState<'locations' | 'anomalies' | 'artifacts' | 'weapons' | 'gear' | 'ignore'>(
    targetCategoryHint || 'anomalies'
  );
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showHowToGuide, setShowHowToGuide] = useState(false);

  const handleFetchGoogleSheetUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleSheetUrl.trim()) {
      setError('Please enter a Google Sheet URL.');
      return;
    }

    setError(null);
    setImportSuccess(null);
    setIsLoading(true);

    try {
      const result = await fetchAndParseGoogleSheetUrl(googleSheetUrl);
      if (result.totalItems === 0) {
        throw new Error('No valid text rows or options found in this Google Sheet. Please check your sheet contents.');
      }
      setParsedData(result);
    } catch (err: any) {
      console.error('Google Sheet fetch error:', err);
      setError(
        err?.message || 
        'Could not load Google Sheet. Ensure the sheet sharing is set to "Anyone with the link can view", or use the "Copy & Paste from Google Sheet" option above!'
      );
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setError('Please paste cells or text from your Google Sheet first.');
      return;
    }

    setError(null);
    setImportSuccess(null);
    setIsLoading(true);

    try {
      const result = parseSpreadsheetFromText(pastedText, 'Pasted Google Sheet / TSV Cells');
      if (result.totalItems === 0) {
        throw new Error('No valid entries detected in the pasted text.');
      }
      setParsedData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse pasted cells.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setImportSuccess(null);
    setIsLoading(true);

    try {
      const validExts = ['.xlsx', '.xls', '.csv', '.tsv'];
      const isExtValid = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
      if (!isExtValid) {
        throw new Error('Please upload an Excel spreadsheet (.xlsx, .xls) or CSV/TSV file.');
      }

      const result = await parseSpreadsheetFile(file);
      if (result.totalItems === 0) {
        throw new Error('No valid text rows or options found in this spreadsheet.');
      }

      setParsedData(result);
    } catch (err: any) {
      console.error('Spreadsheet parse error:', err);
      setError(err?.message || 'Failed to parse spreadsheet file.');
      setParsedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCommit = () => {
    if (!parsedData) return;

    try {
      const res = commitParsedSpreadsheet(parsedData, unclassifiedTarget, importMode);
      const summaryMsg = `Successfully imported ${res.totalAdded} options into the Database! (${res.locationsAdded} Locations, ${res.anomaliesAdded} Anomalies, ${res.artifactsAdded} Artifacts, ${res.weaponsAdded} Weapons, ${res.gearAdded} Gear)`;
      setImportSuccess(summaryMsg);
      
      if (onImportComplete) {
        onImportComplete({
          totalAdded: res.totalAdded,
          locations: res.locationsAdded,
          anomalies: res.anomaliesAdded,
          artifacts: res.artifactsAdded,
          weapons: res.weaponsAdded,
          gear: res.gearAdded
        });
      }
      
      setParsedData(null);
      setPastedText('');
      setGoogleSheetUrl('');
    } catch (err: any) {
      setError(err?.message || 'Failed to save imported options to database.');
    }
  };

  const handleDownloadExcelTemplate = () => {
    const data = generateSampleExcelWorkbook();
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '199X_Database_Options_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsvTemplate = () => {
    const csv = generateSampleCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '199X_Database_Options_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullDatabase = () => {
    const data = exportCurrentDatabaseToExcel(false);
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '199X_Full_Retro_Database_500plus.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {!parsedData ? (
        <div className="space-y-4">
          
          {/* Top Mode Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => { setInputMode('google-sheet-url'); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                inputMode === 'google-sheet-url'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Google Sheet Link</span>
            </button>

            <button
              type="button"
              onClick={() => { setInputMode('paste-cells'); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                inputMode === 'paste-cells'
                  ? 'bg-gradient-to-r from-pink-500/20 to-yellow-500/20 text-pink-300 border border-pink-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-pink-400" />
              <span>2. Copy &amp; Paste Cells</span>
            </button>

            <button
              type="button"
              onClick={() => { setInputMode('file-upload'); setError(null); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                inputMode === 'file-upload'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Upload File (.xlsx/.csv)</span>
            </button>
          </div>

          {/* MODE 1: Google Sheet Link */}
          {inputMode === 'google-sheet-url' && (
            <div className="p-5 rounded-xl bg-zinc-950/80 border border-emerald-900/40 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                    <Globe className="w-4 h-4" />
                    <span>Direct Google Sheet Sync</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Paste the shareable URL of your Google Sheet. The app will fetch and parse all columns automatically!
                  </p>
                </div>
              </div>

              <form onSubmit={handleFetchGoogleSheetUrl} className="space-y-3">
                <div className="relative">
                  <Link2 className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>Make sure Google Sheet is set to: <strong>"Anyone with the link can view"</strong></span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !googleSheetUrl.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-zinc-950 font-black rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    <span>{isLoading ? "Fetching Sheet..." : "Fetch & Load Google Sheet"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: Direct Copy & Paste Cells from Google Sheet */}
          {inputMode === 'paste-cells' && (
            <div className="p-5 rounded-xl bg-zinc-950/80 border border-pink-900/40 space-y-4 animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-pink-400 font-mono font-bold text-xs uppercase tracking-wider">
                  <Copy className="w-4 h-4" />
                  <span>Copy &amp; Paste From Google Sheet</span>
                </div>
                <p className="text-xs text-zinc-300">
                  Open your Google Sheet, select the cells or columns, press <strong className="text-yellow-300">Ctrl+C / Cmd+C</strong>, and paste here:
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Location\tAnomaly\tArtifact\tWeapon\tGear\nAbandoned Mall\tNeon Wraith\tWalkman\tLead Pipe\tWalkman + Pipe\nLaser Tag\tShadow Doppelganger\tCRT Remote\tBaseball Bat\tRemote + Bat`}
                  rows={6}
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Auto-detects headers (Locations, Anomalies, Artifacts, Weapons, Gear) or multi-column layout.
                  </span>

                  <button
                    type="button"
                    onClick={handleParsePastedText}
                    disabled={isLoading || !pastedText.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-400 hover:to-yellow-300 disabled:opacity-40 text-zinc-950 font-black rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Parse Pasted Cells</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: Upload Downloaded File (.xlsx / .csv) */}
          {inputMode === 'file-upload' && (
            <div className="space-y-3 animate-fade-in">
              <div
                id="spreadsheet-dropzone"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
                    : 'border-zinc-700 hover:border-cyan-400 bg-zinc-950/60 hover:bg-zinc-950/90'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-zinc-700 shadow-md">
                  {isLoading ? (
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-100 font-mono tracking-tight">
                    {isLoading ? "Reading & Analyzing Spreadsheet..." : "Click or Drag & Drop File Here"}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md">
                    Accepts Microsoft Excel (<span className="text-cyan-300 font-mono">.xlsx</span>, <span className="text-cyan-300 font-mono">.xls</span>) or Comma-Separated (<span className="text-pink-300 font-mono">.csv</span>) files.
                  </p>
                </div>
              </div>

              {/* How to download from Google Sheet accordion */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHowToGuide(!showHowToGuide)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-900/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold text-cyan-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    How to download from Google Sheets in 2 clicks:
                  </span>
                  {showHowToGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowToGuide && (
                  <div className="px-4 pb-4 pt-1 text-xs font-mono text-zinc-300 space-y-2 border-t border-zinc-800/60 bg-zinc-900/30">
                    <p className="text-[11px] text-zinc-400">
                      In your Google Sheet document tab:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-300 pl-1">
                      <li>Click <strong className="text-yellow-300">File</strong> in the top menu</li>
                      <li>Hover over <strong className="text-yellow-300">Download</strong></li>
                      <li>Select <strong className="text-cyan-300">Microsoft Excel (.xlsx)</strong> or <strong className="text-pink-300">Comma Separated Values (.csv)</strong></li>
                      <li>Drag and drop the downloaded file right into the box above!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Import Issue:</span>
                <span>{error}</span>
                {inputMode === 'google-sheet-url' && (
                  <div className="pt-1.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInputMode('paste-cells')}
                      className="text-[11px] underline text-pink-300 hover:text-pink-200 cursor-pointer"
                    >
                      Try Option 2: Copy &amp; Paste Cells directly instead &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Notification */}
          {importSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Helper Action Buttons: Templates & Backup Export */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Templates &amp; Full Database Export
              </span>
              <p className="text-[11px] text-zinc-500">
                Download starter templates or export the complete 500+ retro database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 hover:border-cyan-500/50 flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Template (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-pink-300 border border-zinc-700 hover:border-pink-500/50 flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                <span>Template (.csv)</span>
              </button>

              <button
                type="button"
                onClick={handleExportFullDatabase}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-yellow-300 border border-zinc-700 hover:border-yellow-500/50 flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Export DB (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Parsed Spreadsheet Review and Confirmation Screen */
        <div className="space-y-4 animate-fade-in">
          {/* Header summary card */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-bold text-zinc-100 font-mono">
                  {parsedData.fileName}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ({Math.round(parsedData.fileSize / 1024) || 1} KB • {parsedData.sheetNames.length} sheet{parsedData.sheetNames.length > 1 ? 's' : ''})
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Detected <span className="text-yellow-400 font-bold">{parsedData.totalItems} options</span> ready to inject into the database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cancel / Choose Different Source</span>
            </button>
          </div>

          {/* Category Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-cyan-400 uppercase">
                <MapPin className="w-3 h-3" />
                <span>Locations</span>
              </div>
              <span className="text-base font-black text-cyan-200 font-mono">
                {parsedData.categories.locations.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-pink-950/30 border border-pink-800/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-pink-400 uppercase">
                <Ghost className="w-3 h-3" />
                <span>Anomalies</span>
              </div>
              <span className="text-base font-black text-pink-200 font-mono">
                {parsedData.categories.anomalies.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-800/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-purple-400 uppercase">
                <Sparkles className="w-3 h-3" />
                <span>Artifacts</span>
              </div>
              <span className="text-base font-black text-purple-200 font-mono">
                {parsedData.categories.artifacts.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-amber-400 uppercase">
                <Sword className="w-3 h-3" />
                <span>Weapons</span>
              </div>
              <span className="text-base font-black text-amber-200 font-mono">
                {parsedData.categories.weapons.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-yellow-950/30 border border-yellow-800/50 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-yellow-400 uppercase">
                <Package className="w-3 h-3" />
                <span>Gear Combos</span>
              </div>
              <span className="text-base font-black text-yellow-200 font-mono">
                {parsedData.categories.gear.length}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                <HelpCircle className="w-3 h-3" />
                <span>Unclassified</span>
              </div>
              <span className="text-base font-black text-zinc-300 font-mono">
                {parsedData.categories.unclassified.length}
              </span>
            </div>
          </div>

          {/* Unclassified Routing Selector */}
          {parsedData.categories.unclassified.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  {parsedData.categories.unclassified.length} unclassified rows found without explicit header
                </span>
                <p className="text-[11px] text-zinc-400">
                  Assign these uncategorized rows to:
                </p>
              </div>

              <select
                value={unclassifiedTarget}
                onChange={(e: any) => setUnclassifiedTarget(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="anomalies">Anomalies / Monsters (Default)</option>
                <option value="locations">Locations</option>
                <option value="artifacts">Artifacts</option>
                <option value="weapons">Weapons</option>
                <option value="gear">Gear Combos</option>
                <option value="ignore">Skip / Do Not Import Unclassified</option>
              </select>
            </div>
          )}

          {/* Preview Table of Rows */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
            <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="font-bold text-zinc-200">
                Preview Sample ({Math.min(parsedData.previewRows.length, 30)} of {parsedData.totalItems} entries):
              </span>
              <span className="text-[10px] text-zinc-500">Auto-parsed and categorized</span>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-zinc-900">
              {parsedData.previewRows.slice(0, 35).map((row, idx) => (
                <div key={idx} className="px-4 py-2 flex items-center justify-between gap-3 text-xs font-mono hover:bg-zinc-900/50">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                      row.category === 'locations' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      row.category === 'anomalies' ? 'bg-pink-950 text-pink-300 border border-pink-800' :
                      row.category === 'artifacts' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      row.category === 'weapons' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      row.category === 'gear' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                      'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {row.category}
                    </span>
                    <span className="text-zinc-200 truncate">{row.value}</span>
                  </div>

                  <span className="text-[10px] text-zinc-500 shrink-0 hidden sm:inline">
                    {row.source}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Import Mode Radio (Merge vs Replace) */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-1">
              <span className="font-bold text-zinc-200 block">Import Mode:</span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-pink-500"
                  />
                  <span>Merge with existing database (Recommended)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-pink-500"
                  />
                  <span>Replace existing custom options</span>
                </label>
              </div>
            </div>

            {/* Commit Import Button */}
            <button
              type="button"
              id="confirm-import-spreadsheet-button"
              onClick={handleCommit}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-yellow-400 hover:from-pink-400 hover:to-yellow-300 text-zinc-950 font-black rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Import {parsedData.totalItems} Options Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
