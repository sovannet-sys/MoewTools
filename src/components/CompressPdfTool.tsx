import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
  TrendingDown,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { CompressionTier, ToolId } from '../types';
import { formatBytes } from '../utils/formatters';
import { compressPdf, TIER_LIMITS } from '../utils/pdfCompressor';

interface CompressPdfToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const CompressPdfTool: React.FC<CompressPdfToolProps> = ({ onBack, onToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionTier>('low');
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      onToast('Please select a valid PDF file.', true);
      return;
    }
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setDownloadUrl(null);
    setProgressPercent(0);
    setProgressStatus('');
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsCompressing(false);
    setProgressStatus('');
    setProgressPercent(0);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    setDownloadUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processCompress = async () => {
    if (!file) return;

    setIsCompressing(true);
    setProgressPercent(10);
    setProgressStatus('Analyzing PDF object tree and streams...');

    try {
      const arrayBuffer = await file.arrayBuffer();

      const result = await compressPdf(arrayBuffer, level, {
        onProgress: (percent, status) => {
          setProgressPercent(percent);
          setProgressStatus(status);
        },
      });

      // Extract exact ArrayBuffer slice to ensure 100% valid Blob byte boundaries
      const exactBuffer = result.pdfBytes.buffer.slice(
        result.pdfBytes.byteOffset,
        result.pdfBytes.byteOffset + result.pdfBytes.byteLength
      );
      const blob = new Blob([exactBuffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setOriginalSize(result.originalSize);
      setCompressedSize(result.compressedSize);
      setDownloadUrl(url);
      setDownloadFileName(`compressed_${file.name}`);

      setProgressPercent(100);
      setProgressStatus('Compression complete!');

      const pctSaved = result.reductionPercentage;
      const tierInfo = TIER_LIMITS[level];

      if (pctSaved > 0) {
        onToast(
          `Compressed successfully! Reduced by ${pctSaved}% (${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)})`
        );
      } else {
        onToast(`PDF optimized and cleaned! (${formatBytes(result.compressedSize)})`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to compress PDF';
      onToast(msg, true);
      setProgressStatus('');
      setProgressPercent(0);
    } finally {
      setIsCompressing(false);
    }
  };

  const reductionPct =
    originalSize && compressedSize
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return (
    <div id="compress-pdf-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            id="compress-back-btn"
            onClick={() => onBack('home')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Back to All Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <FileArchive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span>Compress PDF File Size</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Shrink files with Low (30-50%), Medium (50-70%), and High (70-90%) reduction tiers.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        {/* Upload Drop Zone */}
        {!file ? (
          <div
            id="compress-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-500 dark:hover:border-orange-400 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 bg-slate-50/70 dark:bg-slate-900/40 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to upload or drag & drop your PDF
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                High-capacity stream compression enabled for massive documents
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </div>
        ) : (
          /* File metadata card */
          <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>
            {!isCompressing && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Compression Options and Actions (Only visible when file is uploaded) */}
        {file && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Compression Level Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Compression Level & File Size Reduction Target
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLevel('low')}
                  disabled={isCompressing}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                    level === 'low'
                      ? 'border-orange-600 bg-orange-500/10 dark:bg-orange-500/15 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-orange-400'
                  }`}
                >
                  <span className="text-xs font-extrabold">Low</span>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1">
                    30 - 50%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Vector Sharp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('medium')}
                  disabled={isCompressing}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                    level === 'medium'
                      ? 'border-orange-600 bg-orange-500/10 dark:bg-orange-500/15 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-orange-400'
                  }`}
                >
                  <span className="text-xs font-extrabold">Medium</span>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1">
                    50 - 70%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Balanced</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('high')}
                  disabled={isCompressing}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                    level === 'high'
                      ? 'border-orange-600 bg-orange-500/10 dark:bg-orange-500/15 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-orange-400'
                  }`}
                >
                  <span className="text-xs font-extrabold">High</span>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1">
                    70 - 90%
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Ultra Tiny</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 justify-center">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>
                  {level === 'low' && 'Maximum document clarity & crisp vector fonts preserved.'}
                  {level === 'medium' && 'Recommended for email sharing, portals, and uploads.'}
                  {level === 'high' && 'Maximum compression ratio for archival and bandwidth savings.'}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {isCompressing && (
              <div className="space-y-2 py-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                    <span>{progressStatus || 'Compressing...'}</span>
                  </span>
                  <span className="font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Compress Action Button */}
            {!downloadUrl && (
              <button
                id="compress-process-btn"
                onClick={processCompress}
                disabled={isCompressing}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-orange-500/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing PDF...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4" />
                    <span>Compress PDF Size</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Compression Result & Download Card */}
        {downloadUrl && (
          <div
            id="compress-result-card"
            className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Compression Complete!
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                    {formatBytes(originalSize)} &rarr; {formatBytes(compressedSize)}
                  </p>
                </div>
              </div>
              {reductionPct > 0 && (
                <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-extrabold flex items-center space-x-1 shadow-sm">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-{reductionPct}%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                id="compress-download-link"
                href={downloadUrl}
                download={downloadFileName}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Compressed PDF</span>
              </a>
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
              >
                Compress Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
