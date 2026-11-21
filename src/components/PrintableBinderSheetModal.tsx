import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Sparkles, 
  Check, 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Loader2,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ArchiveCardRecord } from '../utils/archiveDb';
import { createBinderSheetCanvas, generateSingleSheetPdf } from '../services/bookPdfGenerator';

interface PrintableBinderSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: (ArchiveCardRecord & { previewUrl: string })[];
  initialSheetNumber?: number;
  binderMode?: 'cards' | 'videos' | 'front' | 'back';
  onOpenFullBookModal?: () => void;
}

export const PrintableBinderSheetModal: React.FC<PrintableBinderSheetModalProps> = ({
  isOpen,
  onClose,
  cards,
  initialSheetNumber = 1,
  binderMode = 'cards',
  onOpenFullBookModal,
}) => {
  const CARDS_PER_SHEET = 9;
  const totalSheets = Math.max(1, Math.ceil(cards.length / CARDS_PER_SHEET));

  const [activeSheet, setActiveSheet] = useState<number>(initialSheetNumber);
  const [theme, setTheme] = useState<'polypropylene' | 'clean-print'>('polypropylene');
  const [paperFormat, setPaperFormat] = useState<'letter' | 'a4'>('letter');

  // Preview render state
  const [renderedImageUrl, setRenderedImageUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Sync active sheet when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveSheet(Math.min(Math.max(1, initialSheetNumber), totalSheets));
    }
  }, [isOpen, initialSheetNumber, totalSheets]);

  // Render the high-resolution sheet canvas whenever sheet or theme changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const renderSheet = async () => {
      setIsRendering(true);
      try {
        const sheetCards = cards.slice((activeSheet - 1) * CARDS_PER_SHEET, activeSheet * CARDS_PER_SHEET);
        const dataUrl = await createBinderSheetCanvas(
          sheetCards,
          activeSheet,
          totalSheets,
          cards.length,
          theme
        );
        if (isMounted) {
          setRenderedImageUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to render binder sheet canvas:', err);
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    renderSheet();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeSheet, totalSheets, cards, theme]);

  // Handle keyboard navigation (Left/Right to flip sheets, Escape to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && activeSheet > 1) {
        setActiveSheet(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && activeSheet < totalSheets) {
        setActiveSheet(prev => prev + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSheet, totalSheets, onClose]);

  // 1. Save Full Page as High-Res Image (PNG / JPEG)
  const handleSavePageAsImage = async () => {
    if (!renderedImageUrl || isExportingImage) return;
    setIsExportingImage(true);
    try {
      const a = document.createElement('a');
      a.href = renderedImageUrl;
      a.download = `trapper_keeper_sheet_${String(activeSheet).padStart(2, '0')}_${theme}_print.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download sheet image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  // 2. Save Full Page as PDF
  const handleSavePageAsPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const sheetCards = cards.slice((activeSheet - 1) * CARDS_PER_SHEET, activeSheet * CARDS_PER_SHEET);
      const pdfBlob = await generateSingleSheetPdf(
        sheetCards,
        activeSheet,
        totalSheets,
        cards.length,
        theme,
        paperFormat
      );

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trapper_keeper_sheet_${String(activeSheet).padStart(2, '0')}_printable.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Failed to export single sheet PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. Direct Browser Print Spooler
  const handlePrintDirect = () => {
    if (!renderedImageUrl) return;

    // Create an isolated printable window or iframe for direct edge-to-edge printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Fallback: trigger standard print with current page print styling
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trapper Keeper Sheet #${String(activeSheet).padStart(2, '0')} - Printable View</title>
          <style>
            @page {
              size: ${paperFormat === 'a4' ? 'A4 portrait' : 'letter portrait'};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: ${theme === 'clean-print' ? '#ffffff' : '#000000'};
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            img {
              width: 100vw;
              height: 100vh;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${renderedImageUrl}" onload="window.focus(); window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 4. Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    if (!renderedImageUrl) return;
    try {
      const res = await fetch(renderedImageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      // If direct clipboard write is blocked, copy data URL as text
      try {
        await navigator.clipboard.writeText(renderedImageUrl);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy sheet to clipboard:', err);
      }
    }
  };

  if (!isOpen) return null;

  const currentSheetStartCard = (activeSheet - 1) * CARDS_PER_SHEET + 1;
  const currentSheetEndCard = Math.min(activeSheet * CARDS_PER_SHEET, cards.length);

  return (
    <AnimatePresence>
      <div 
        id="printable-binder-sheet-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl max-h-[95vh] rounded-3xl bg-zinc-950 border-2 border-zinc-700 shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-zinc-100 font-mono"
        >
          {/* Modal Header Bar */}
          <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-950/80 border border-pink-500/50 flex items-center justify-center text-pink-400 shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-900/60 text-pink-300 border border-pink-700/60 uppercase">
                    PRINTABLE ARCHIVAL VIEW
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    300 DPI STANDARD 9-POCKET SLEEVE
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-wider text-zinc-100 flex items-center gap-2">
                  FULL BINDER PAGE // <span className="text-pink-400">SHEET #{String(activeSheet).padStart(2, '0')}</span>
                </h3>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2">
              {onOpenFullBookModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullBookModal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-700/60 text-xs font-bold transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>DOWNLOAD FULL BOOK (PDF)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Printable View (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader Toolbar: Sheet Navigator & View Settings */}
          <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            
            {/* Sheet Flipper */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeSheet <= 1}
                onClick={() => setActiveSheet(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="Previous Sheet (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-700 font-bold">
                <span className="text-pink-400">SHEET {activeSheet}</span> OF {totalSheets}
                <span className="text-zinc-500 font-normal text-[11px] ml-2 hidden sm:inline">
                  (Cards #{currentSheetStartCard}–{currentSheetEndCard})
                </span>
              </div>

              <button
                type="button"
                disabled={activeSheet >= totalSheets}
                onClick={() => setActiveSheet(prev => Math.min(totalSheets, prev + 1))}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                title="Next Sheet (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Direct Sheet Jumper Dropdown if more than 1 sheet */}
              {totalSheets > 1 && (
                <select
                  value={activeSheet}
                  onChange={(e) => setActiveSheet(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {Array.from({ length: totalSheets }, (_, i) => i + 1).map(s => (
                    <option key={s} value={s}>
                      Go to Sheet {s} ({cards.slice((s - 1) * 9, s * 9).length} cards)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Print Theme & Paper Options */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  id="printable-theme-white-btn"
                  onClick={() => setTheme('clean-print')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    theme === 'clean-print'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Crisp white archival sheet backing with translucent Ultra PRO sleeves, keeping cards obsidian-black"
                >
                  <span className="w-2 h-2 rounded-full bg-white border border-zinc-400 inline-block" />
                  <span>WHITE BACKGROUND</span>
                </button>

                <button
                  type="button"
                  id="printable-theme-dark-btn"
                  onClick={() => setTheme('polypropylene')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    theme === 'polypropylene'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Dark 1990s obsidian archival background with 3-hole binder grommets"
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-600 inline-block" />
                  <span>OBSIDIAN (DARK)</span>
                </button>
              </div>

              {/* Paper Format Selector */}
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPaperFormat('letter')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    paperFormat === 'letter' ? 'bg-zinc-800 text-yellow-300' : 'text-zinc-400'
                  }`}
                >
                  LETTER (8.5×11")
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('a4')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    paperFormat === 'a4' ? 'bg-zinc-800 text-yellow-300' : 'text-zinc-400'
                  }`}
                >
                  A4
                </button>
              </div>
            </div>

          </div>

          {/* Main Printable Page Elevation & Canvas Viewport */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-zinc-950/90 relative min-h-[420px]">
            
            {isRendering ? (
              <div className="flex flex-col items-center justify-center gap-3 text-pink-400 py-16">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs tracking-wider">COMPILING HIGH-RES 300 DPI BINDER SHEET CANVAS...</span>
              </div>
            ) : renderedImageUrl ? (
              <div 
                className="relative rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-zinc-800 transition-transform duration-200"
                style={{ 
                  maxWidth: '100%',
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center'
                }}
              >
                <img
                  src={renderedImageUrl}
                  alt={`Trapper Keeper Sheet #${activeSheet}`}
                  className="rounded-2xl max-h-[64vh] w-auto object-contain border border-zinc-800/80 shadow-2xl block"
                />

                {/* Corner Watermark */}
                <div className="absolute bottom-3 right-4 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-zinc-400 border border-zinc-800 pointer-events-none">
                  PRINT READY • 1600 × 2070 PX
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs">
                No cards available in this sheet.
              </div>
            )}

            {/* Zoom Controls Overlay */}
            {renderedImageUrl && !isRendering && (
              <div className="absolute bottom-5 left-6 bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg backdrop-blur-sm z-10">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.15))}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1.5 text-zinc-400 w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.15))}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer text-[10px]"
                  title="Reset Zoom"
                >
                  FIT
                </button>
              </div>
            )}

          </div>

          {/* Action Footer: Save As Image, Save As PDF, Print Now */}
          <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
            
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="text-pink-400 font-bold">PRO TIP:</span>
              <span className="hidden sm:inline">Use "Save Image" for photo galleries, or "Save PDF / Print" for physical binders.</span>
              <span className="sm:hidden">Print or save this 9-pocket sheet.</span>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Copy Image Button */}
              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                disabled={!renderedImageUrl || isRendering}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Copy full sheet image to clipboard"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>COPY IMAGE</span>
                  </>
                )}
              </button>

              {/* Save As Image (PNG / JPEG) */}
              <button
                type="button"
                onClick={handleSavePageAsImage}
                disabled={!renderedImageUrl || isRendering || isExportingImage}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white border border-cyan-400/50 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                title="Download full 9-pocket page as high-resolution 1600x2070 image"
              >
                {isExportingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-cyan-200" />
                )}
                <span>SAVE FULL PAGE (IMAGE)</span>
              </button>

              {/* Save As PDF */}
              <button
                type="button"
                onClick={handleSavePageAsPdf}
                disabled={!renderedImageUrl || isRendering || isExportingPdf}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white border border-purple-400/50 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                title="Download this single sheet as a print-ready vector PDF document"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-200" />
                )}
                <span>SAVE FULL PAGE (PDF)</span>
              </button>

              {/* Print Now Button */}
              <button
                type="button"
                onClick={handlePrintDirect}
                disabled={!renderedImageUrl || isRendering}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:from-pink-500 hover:to-cyan-400 disabled:opacity-40 text-white border border-pink-400/60 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,0,127,0.4)]"
                title="Send current sheet directly to physical printer via browser print dialog"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>PRINT SHEET NOW</span>
              </button>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
