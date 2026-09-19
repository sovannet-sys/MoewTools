import React, { useState, useRef } from 'react';
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileImage,
  FileText,
  ImageIcon,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
  ZoomIn,
} from 'lucide-react';
import { ToolId } from '../types';
import { formatBytes } from '../utils/formatters';
import {
  convertPdfToPng,
  createPngZipArchive,
  PdfToPngResult,
  PngDpiScale,
  RenderedPageImage,
} from '../utils/pdfToPng';

interface PdfToPngToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const PdfToPngTool: React.FC<PdfToPngToolProps> = ({ onBack, onToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [scale, setScale] = useState<PngDpiScale>(2);
  const [pageRangeMode, setPageRangeMode] = useState<'all' | 'custom'>('all');
  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);

  const [isConverting, setIsConverting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [result, setResult] = useState<PdfToPngResult | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [previewImage, setPreviewImage] = useState<RenderedPageImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      onToast('Please select a valid PDF file.', true);
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setProgressPercent(0);
    setProgressStatus('');
    setDetectedPages(null);

    // Inspect page count
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfjs = typeof window !== 'undefined' ? (window as any).pdfjsLib : null;
      if (pdfjs) {
        const buffer = await selectedFile.arrayBuffer();
        const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
        const doc = await task.promise;
        setDetectedPages(doc.numPages);
        setStartPage(1);
        setEndPage(doc.numPages);
      }
    } catch {
      // If inspection fails or requires password, proceed with default
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setIsConverting(false);
    setProgressStatus('');
    setProgressPercent(0);
    setDetectedPages(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setProgressPercent(5);
    setProgressStatus('Reading PDF file...');

    try {
      const arrayBuffer = await file.arrayBuffer();

      const pageRangeOpt =
        pageRangeMode === 'custom'
          ? { start: Math.max(1, startPage), end: Math.max(startPage, endPage) }
          : 'all';

      const res = await convertPdfToPng(arrayBuffer, file.name, {
        scale,
        pageRange: pageRangeOpt,
        onProgress: (percent, status) => {
          setProgressPercent(percent);
          setProgressStatus(status);
        },
      });

      setResult(res);
      setProgressStatus('Conversion complete!');
      onToast(`Successfully converted ${res.pages.length} page(s) to PNG!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert PDF to PNG.';
      onToast(msg, true);
      setProgressStatus('');
      setProgressPercent(0);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (!result || result.pages.length === 0) return;

    setIsZipping(true);
    try {
      const zipBlob = await createPngZipArchive(result.pages, result.fileName);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const cleanName = result.fileName.replace(/\.[^/.]+$/, '');
      a.download = `${cleanName}_png_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('ZIP archive downloaded successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate ZIP archive.';
      onToast(msg, true);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSinglePng = (page: RenderedPageImage) => {
    if (!result) return;
    const cleanName = result.fileName.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = page.dataUrl;
    a.download = `${cleanName}-page-${page.pageNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="pdf-to-png-container" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        id="btn-back-to-home"
        onClick={() => onBack('home')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Tools</span>
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <FileImage className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                PDF to PNG Converter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Render every page of your PDF into crisp, high-resolution PNG images with zero quality loss
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50">
              Lossless Pixel Clarity
            </span>
          </div>
        </div>
      </div>

      {/* Main interactive panel */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-6">
        {/* Upload Zone */}
        {!file ? (
          <div
            id="pdf2png-dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition-all rounded-3xl p-8 sm:p-10 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 group"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Click to upload or drag & drop PDF
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports single or multi-page documents &bull; Processed 100% in your browser
            </p>
            <input
              id="pdf2png-file-input"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </div>
        ) : (
          /* Selected File Information */
          <div
            id="pdf2png-file-selected-card"
            className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formatBytes(file.size)}
                  {detectedPages && ` \u2022 ${detectedPages} total pages`}
                </p>
              </div>
            </div>
            <button
              id="btn-remove-selected-pdf"
              onClick={handleReset}
              disabled={isConverting}
              className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Select different file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Options: Resolution & Page Range */}
        {file && !result && (
          <div className="space-y-4 pt-2">
            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                <span>Image Resolution (DPI Scale)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    val: 1 as PngDpiScale,
                    title: 'Standard (72 DPI)',
                    desc: 'Fast rendering, compact file sizes',
                  },
                  {
                    val: 2 as PngDpiScale,
                    title: 'High Quality (144 DPI)',
                    desc: 'Crisp vector text, recommended',
                  },
                  {
                    val: 3 as PngDpiScale,
                    title: 'Ultra HD (216 DPI)',
                    desc: 'Maximum sharpness, print-ready',
                  },
                ].map((item) => (
                  <button
                    key={item.val}
                    id={`btn-scale-${item.val}`}
                    type="button"
                    onClick={() => setScale(item.val)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      scale === item.val
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-950 dark:text-teal-100 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold">{item.title}</p>
                      {scale === item.val && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Range Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pages to Convert
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-range-all"
                  type="button"
                  onClick={() => setPageRangeMode('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    pageRangeMode === 'all'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  All Pages {detectedPages ? `(1 – ${detectedPages})` : ''}
                </button>
                <button
                  id="btn-range-custom"
                  type="button"
                  onClick={() => setPageRangeMode('custom')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    pageRangeMode === 'custom'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Custom Page Range
                </button>
              </div>

              {pageRangeMode === 'custom' && (
                <div className="flex items-center space-x-3 pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">From page:</span>
                    <input
                      id="input-start-page"
                      type="number"
                      min={1}
                      max={detectedPages || 9999}
                      value={startPage}
                      onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-center text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">To page:</span>
                    <input
                      id="input-end-page"
                      type="number"
                      min={startPage}
                      max={detectedPages || 9999}
                      value={endPage}
                      onChange={(e) =>
                        setEndPage(Math.max(startPage, parseInt(e.target.value) || startPage))
                      }
                      className="w-20 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-center text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Convert Action Button */}
            <div className="pt-2">
              <button
                id="btn-convert-to-png"
                type="button"
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting PDF to PNG...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Convert PDF to PNG Images</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress Display */}
        {isConverting && (
          <div
            id="pdf2png-progress-container"
            className="space-y-2 p-5 bg-teal-50 dark:bg-teal-950/30 rounded-2xl border border-teal-200 dark:border-teal-900/50"
          >
            <div className="flex justify-between items-center text-xs font-bold text-teal-900 dark:text-teal-200">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>{progressStatus || 'Converting document...'}</span>
              </div>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-teal-200 dark:bg-teal-900/50 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-600 to-emerald-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Section: Image Gallery & Downloads */}
        {result && !isConverting && (
          <div id="pdf2png-results-container" className="space-y-6 animate-in fade-in">
            {/* Top Results Bar */}
            <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {result.pages.length} Page{result.pages.length === 1 ? '' : 's'} Converted to PNG!
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Resolution: {scale}x ({scale === 1 ? '72' : scale === 2 ? '144' : '216'} DPI) &bull; 100% Sharp Lossless Images
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-download-all-zip"
                  type="button"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition cursor-pointer disabled:opacity-50"
                >
                  {isZipping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                  <span>{isZipping ? 'Creating ZIP...' : 'Download All as ZIP'}</span>
                </button>
                <button
                  id="btn-convert-another"
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Convert Another
                </button>
              </div>
            </div>

            {/* Gallery Grid of Pages */}
            <div
              id="pdf2png-gallery-grid"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
              {result.pages.map((p) => (
                <div
                  key={p.pageNumber}
                  id={`png-page-card-${p.pageNumber}`}
                  className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden hover:border-teal-400 dark:hover:border-teal-500/60 transition group flex flex-col justify-between"
                >
                  {/* Image Preview Container */}
                  <div
                    className="relative aspect-[3/4] bg-white dark:bg-slate-950 flex items-center justify-center p-2 cursor-pointer overflow-hidden border-b border-slate-100 dark:border-slate-800"
                    onClick={() => setPreviewImage(p)}
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="max-h-full max-w-full object-contain shadow-xs group-hover:scale-102 transition-transform duration-200"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <span className="p-2 rounded-full bg-slate-900/80 backdrop-blur-xs flex items-center space-x-1 text-xs font-semibold">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer info & single download */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Page {p.pageNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {p.width} &times; {p.height} px
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <span>{formatBytes(p.sizeBytes)}</span>
                      <button
                        id={`btn-download-page-${p.pageNumber}`}
                        type="button"
                        onClick={() => handleDownloadSinglePng(p)}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download PNG</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Size Preview Modal */}
      {previewImage && (
        <div
          id="png-preview-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Page {previewImage.pageNumber} Preview
                </span>
                <span className="text-xs text-slate-500">
                  ({previewImage.width} &times; {previewImage.height} px &bull; {formatBytes(previewImage.sizeBytes)})
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadSinglePng(previewImage)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={previewImage.dataUrl}
                alt={`Full preview page ${previewImage.pageNumber}`}
                className="max-h-[75vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
