import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  X, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Sparkles, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert,
  Loader2,
  Bookmark,
  Share2,
  Palette,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ArchiveCardRecord } from '../utils/archiveDb';
import { 
  generateBookPdf, 
  createCoverCanvas, 
  createIndexCanvas, 
  createBinderSheetCanvas,
  createCardDossierSpreadCanvas,
  BookOptions 
} from '../services/bookPdfGenerator';

interface DownloadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: (ArchiveCardRecord & { previewUrl: string })[];
  currentSheetNumber?: number;
  initialSheetTheme?: 'polypropylene' | 'clean-print';
}

export const DownloadBookModal: React.FC<DownloadBookModalProps> = ({
  isOpen,
  onClose,
  cards,
  currentSheetNumber = 1,
  initialSheetTheme = 'clean-print',
}) => {
  const [bookType, setBookType] = useState<'binder-album' | 'dossier-compendium' | 'deluxe-edition' | 'current-sheet'>('binder-album');
  const [bookTitle, setBookTitle] = useState<string>('199X SUBURBAN ROGUELIKE // CLASSIFIED FIELD GUIDE');
  const [investigatorName, setInvestigatorName] = useState<string>('OFFICER DALE HENDERSON & CREW');
  const [paperFormat, setPaperFormat] = useState<'letter' | 'a4'>('letter');
  const [sheetTheme, setSheetTheme] = useState<'polypropylene' | 'clean-print'>(initialSheetTheme);
  
  // Sync sheetTheme when modal opens if initialSheetTheme changes
  useEffect(() => {
    if (isOpen && initialSheetTheme) {
      setSheetTheme(initialSheetTheme);
    }
  }, [isOpen, initialSheetTheme]);
  
  // Generation & progress state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Live preview state
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [previewImages, setPreviewImages] = useState<{ title: string; dataUrl: string }[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  const CARDS_PER_SHEET = 9;
  const totalSheets = Math.max(1, Math.ceil(cards.length / CARDS_PER_SHEET));

  // Compute total pages in output book
  const calculatedPageCount = () => {
    if (bookType === 'current-sheet') return 1;
    let count = 2; // Cover + Back Cover
    if (cards.length > 0) count += 1; // Index
    if (bookType === 'binder-album' || bookType === 'deluxe-edition') {
      count += totalSheets;
    }
    if (bookType === 'dossier-compendium' || bookType === 'deluxe-edition') {
      count += cards.length;
    }
    return count;
  };

  // Generate lightweight live page previews when options or modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadPreviews = async () => {
      setIsPreviewLoading(true);
      try {
        const previews: { title: string; dataUrl: string }[] = [];
        const opts: BookOptions = {
          title: bookTitle,
          investigatorName,
          format: paperFormat,
          bookType,
          sheetTheme
        };

        // 1. Cover
        if (bookType !== 'current-sheet') {
          const cover = await createCoverCanvas(cards, opts);
          if (isMounted) previews.push({ title: 'Cover Page', dataUrl: cover });
        }

        // 2. Index
        if (bookType !== 'current-sheet' && cards.length > 0) {
          const idx = await createIndexCanvas(cards, opts);
          if (isMounted) previews.push({ title: 'Anomaly Index', dataUrl: idx });
        }

        // 3. Sheet 1
        if (bookType === 'binder-album' || bookType === 'deluxe-edition' || bookType === 'current-sheet') {
          const sheetNum = bookType === 'current-sheet' ? currentSheetNumber : 1;
          const sheetCards = cards.slice((sheetNum - 1) * CARDS_PER_SHEET, sheetNum * CARDS_PER_SHEET);
          const sheet = await createBinderSheetCanvas(sheetCards, sheetNum, totalSheets, cards.length, sheetTheme);
          if (isMounted) previews.push({ title: `Sheet #${sheetNum} (9-Pocket)`, dataUrl: sheet });
        }

        // 4. Sample Dossier if compendium or deluxe
        if ((bookType === 'dossier-compendium' || bookType === 'deluxe-edition') && cards.length > 0) {
          const dossier = await createCardDossierSpreadCanvas(cards[0], 0, opts);
          if (isMounted) previews.push({ title: `Dossier: ${cards[0].encounter.entity_name}`, dataUrl: dossier });
        }

        if (isMounted) {
          setPreviewImages(previews);
          setPreviewPageIndex(0);
        }
      } catch (err) {
        console.error('Failed to generate book previews:', err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    loadPreviews();

    return () => {
      isMounted = false;
    };
  }, [isOpen, bookType, paperFormat, sheetTheme]);

  const handleDownloadPdf = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setDownloadSuccess(false);
    setProgressStatus('Initializing Trapper Keeper Book Engine...');
    setProgressPct(5);

    try {
      const opts: BookOptions = {
        title: bookTitle,
        investigatorName,
        format: paperFormat,
        bookType,
        sheetTheme,
        currentSheetNumber,
        includeCover: bookType !== 'current-sheet',
        includeIndex: bookType !== 'current-sheet',
        includeBackCover: bookType !== 'current-sheet',
      };

      const pdfBlob = await generateBookPdf(cards, opts, (status, pct) => {
        setProgressStatus(status);
        setProgressPct(pct);
      });

      // Trigger download
      const safeTitle = (bookTitle || '199X_Trapper_Keeper_Book')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_');
      const filename = `${safeTitle}.pdf`;

      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 3000);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setProgressStatus(`Error generating book: ${err?.message || 'Failed'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintBook = async () => {
    // Generate full PDF blob and open in new print window
    setIsGenerating(true);
    setProgressStatus('Preparing print spooler...');
    try {
      const opts: BookOptions = {
        title: bookTitle,
        investigatorName,
        format: paperFormat,
        bookType,
        sheetTheme,
        currentSheetNumber,
      };
      const pdfBlob = await generateBookPdf(cards, opts);
      const blobUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.focus();
      }
    } catch (e) {
      console.error('Print preview failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-5xl bg-zinc-950 border-2 border-pink-500/70 rounded-3xl shadow-[0_0_60px_rgba(255,0,127,0.3)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-purple-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,0,127,0.5)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  ARCHIVAL BOOK BINDER
                </span>
                <span className="text-zinc-500 text-xs font-mono">• 300 DPI PRINTABLE PDF</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                SAVE AS DOWNLOADABLE BOOK
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body: 2 Columns (Options on Left, Live Page Preview on Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Configuration Controls */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Book Style Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                <span>1. SELECT BOOK FORMAT & STRUCTURE</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Binder Album */}
                <button
                  type="button"
                  onClick={() => setBookType('binder-album')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    bookType === 'binder-album'
                      ? 'bg-pink-950/40 border-pink-500 shadow-[0_0_20px_rgba(255,0,127,0.25)]'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-pink-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-pink-400" />
                      9-POCKET BINDER ALBUM
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                      AUTHENTIC
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Retro Trapper Keeper cover, Anomaly Index, and all 9-pocket trading card sheets with 3-ring binder punch holes.
                  </p>
                </button>

                {/* 2. Classified Dossier Compendium */}
                <button
                  type="button"
                  onClick={() => setBookType('dossier-compendium')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    bookType === 'dossier-compendium'
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-cyan-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      FIELD DOSSIER COMPENDIUM
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      FULL SPREADS
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    High-res full page per entity with large pre-vis art, Impel 1-7 power ratings matrix, combat log, and lore.
                  </p>
                </button>

                {/* 3. Deluxe Archival Edition */}
                <button
                  type="button"
                  onClick={() => setBookType('deluxe-edition')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    bookType === 'deluxe-edition'
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      DELUXE COMPLETE BOOK
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      ALL-IN-ONE
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Combines retro cover, Anomaly Roster, 9-pocket binder sheets, AND individual high-res dossiers + back cover!
                  </p>
                </button>

                {/* 4. Current Sheet Only */}
                <button
                  type="button"
                  onClick={() => setBookType('current-sheet')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    bookType === 'current-sheet'
                      ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      CURRENT SHEET #{currentSheetNumber} ONLY
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      SINGLE SHEET
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Instantly save just the active 9-pocket sheet currently in view as a printable 1-page PDF.
                  </p>
                </button>
              </div>
            </div>

            {/* Book Metadata Customization */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs">
              <span className="font-bold text-cyan-400 uppercase tracking-wider block border-b border-zinc-800 pb-2">
                2. BOOK CUSTOMIZATION & OPERATIVE CREDENTIALS
              </span>

              <div className="space-y-2">
                <label className="text-[11px] text-zinc-400">BOOK TITLE / SERIES BANNER</label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Enter book title..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400">ASSIGNED OPERATIVE / COLLECTOR</label>
                  <input
                    type="text"
                    value={investigatorName}
                    onChange={(e) => setInvestigatorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Investigator name..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-400">PRINT FORMAT (PAGE SIZE)</label>
                  <select
                    value={paperFormat}
                    onChange={(e) => setPaperFormat(e.target.value as 'letter' | 'a4')}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="letter">US Letter (8.5" × 11") - Standard</option>
                    <option value="a4">A4 (210mm × 297mm) - International</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Binder Sheet Background Style Selector (Toggle for White Background while keeping cards black) */}
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <label className="font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>3. BINDER SHEET BACKGROUND STYLE</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  CARDS REMAIN JET-BLACK
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Choose your binder sheet backing. Inside the clear sleeves, all trading cards maintain their iconic obsidian-black chassis and vibrant neon foil borders!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Option 1: Clean White Background */}
                <button
                  type="button"
                  id="toggle-binder-bg-white-btn"
                  onClick={() => setSheetTheme('clean-print')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    sheetTheme === 'clean-print'
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                      sheetTheme === 'clean-print' ? 'text-cyan-200' : 'text-zinc-300'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-400 shadow-xs inline-block" />
                      WHITE BACKGROUND
                    </span>
                    {sheetTheme === 'clean-print' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-tight">
                    Translucent Ultra PRO clear-white polypropylene sheet. High-contrast display with ink-saver print fidelity.
                  </p>
                </button>

                {/* Option 2: Obsidian Polypropylene Background */}
                <button
                  type="button"
                  id="toggle-binder-bg-dark-btn"
                  onClick={() => setSheetTheme('polypropylene')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                    sheetTheme === 'polypropylene'
                      ? 'bg-pink-950/40 border-pink-500 shadow-[0_0_20px_rgba(255,0,127,0.25)] ring-1 ring-pink-500'
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                      sheetTheme === 'polypropylene' ? 'text-pink-200' : 'text-zinc-300'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-600 shadow-xs inline-block" />
                      OBSIDIAN SLATE (DARK)
                    </span>
                    {sheetTheme === 'polypropylene' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-tight">
                    Cosmic obsidian-slate binder album backing with frosted translucent sleeve pockets. Classic darkroom presentation.
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Summary Telemetry */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-400">
                <Layers className="w-4 h-4 text-pink-400" />
                <span>BOOK SIZE: <strong className="text-white">{calculatedPageCount()} PAGES</strong></span>
              </div>
              <div className="text-zinc-500">
                <span>{cards.length} CARDS IN ARCHIVE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Page Preview */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LIVE BOOK PAGE PREVIEW</span>
              </span>
              {previewImages.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewPageIndex(Math.max(0, previewPageIndex - 1))}
                    disabled={previewPageIndex === 0}
                    className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-zinc-400">
                    {previewPageIndex + 1} / {previewImages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewPageIndex(Math.min(previewImages.length - 1, previewPageIndex + 1))}
                    disabled={previewPageIndex === previewImages.length - 1}
                    className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview Frame */}
            <div className="flex-1 min-h-[380px] bg-zinc-950 rounded-2xl border-2 border-zinc-800 p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              {isPreviewLoading ? (
                <div className="text-center font-mono text-xs text-zinc-500 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-400 mx-auto" />
                  <p>Rendering book page preview...</p>
                </div>
              ) : previewImages[previewPageIndex] ? (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-2">
                  <div className="relative max-h-[340px] w-auto shadow-2xl rounded-lg overflow-hidden border border-zinc-700 bg-black">
                    <img
                      src={previewImages[previewPageIndex].dataUrl}
                      alt={previewImages[previewPageIndex].title}
                      className="max-h-[340px] w-auto object-contain block"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                    {previewImages[previewPageIndex].title}
                  </div>
                </div>
              ) : (
                <div className="text-center font-mono text-xs text-zinc-500">
                  Select an option to view page preview
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Progress / Status display */}
          <div className="flex items-center gap-3 font-mono text-xs">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-pink-400 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progressStatus || 'Generating book...'}</span>
                <span className="text-zinc-500">({progressPct}%)</span>
              </div>
            ) : downloadSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Book successfully saved to your downloads folder!</span>
              </div>
            ) : (
              <span className="text-zinc-500">
                Ready to compile {calculatedPageCount()} pages into standalone PDF.
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrintBook}
              disabled={isGenerating}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Print directly or save via system PDF dialog"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>PRINT BOOK</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-90 text-white font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,127,0.4)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>COMPILING...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD PDF BOOK</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
