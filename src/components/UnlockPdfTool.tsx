import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Unlock,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ToolId } from '../types';
import { formatBytes } from '../utils/formatters';
import { unlockPdf } from '../utils/pdfUnlocker';

interface UnlockPdfToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: {
        workerSrc: string;
      };
      getDocument: (params: {
        data: ArrayBuffer | Uint8Array;
        password?: string;
      }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getViewport: (params: { scale: number }) => {
              width: number;
              height: number;
            };
            render: (params: {
              canvasContext: CanvasRenderingContext2D;
              viewport: { width: number; height: number };
            }) => {
              promise: Promise<void>;
            };
          }>;
        }>;
      };
    };
  }
}

export const UnlockPdfTool: React.FC<UnlockPdfToolProps> = ({ onBack, onToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const [unlockedSizeBytes, setUnlockedSizeBytes] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      onToast('Please select a valid PDF file.', true);
      return;
    }
    setFile(selectedFile);
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
    setIsProcessing(false);
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

  const processUnlock = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPercent(5);
    setProgressStatus('Reading PDF file bytes...');

    try {
      const arrayBuffer = await file.arrayBuffer();

      const result = await unlockPdf(arrayBuffer, {
        onProgress: (percent, status) => {
          setProgressPercent(percent);
          setProgressStatus(status);
        },
      });

      // Extract exact ArrayBuffer slice for 100% valid Blob byte boundaries
      const exactBuffer = result.unlockedBytes.buffer.slice(
        result.unlockedBytes.byteOffset,
        result.unlockedBytes.byteOffset + result.unlockedBytes.byteLength
      );
      const blob = new Blob([exactBuffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setDownloadFileName(`unlocked_${file.name}`);
      setUnlockedSizeBytes(result.unlockedSize);

      setProgressPercent(100);
      setProgressStatus('PDF Unlocked Successfully!');

      if (result.isAlreadyDecrypted) {
        onToast('Document was verified: Security restrictions and permission locks cleared with 100% original quality!');
      } else {
        onToast('PDF successfully decrypted with 100% original quality! Passwords and restrictions removed.');
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Failed to unlock PDF';
      let friendlyMsg = rawMsg;
      if (
        rawMsg.toLowerCase().includes('password') ||
        rawMsg.includes('PasswordException') ||
        rawMsg.includes('Incorrect password')
      ) {
        friendlyMsg = 'This PDF is protected with a user password and could not be unlocked.';
      } else if (rawMsg.includes('Unsupported encryption') || rawMsg.includes('V=4, R=4')) {
        friendlyMsg = 'Document is protected with custom security and could not be unlocked.';
      }
      onToast(friendlyMsg, true);
      setProgressStatus('');
      setProgressPercent(0);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="unlock-pdf-container" className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            id="unlock-back-btn"
            onClick={() => onBack('home')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Back to All Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Unlock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>Unlock PDF</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Remove passwords, editing locks, and restrictions automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
        {/* Upload Drop Zone */}
        {!file ? (
          <div
            id="unlock-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-rose-500 dark:hover:border-rose-400 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 bg-slate-50/70 dark:bg-slate-900/40 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to upload or drag & drop locked PDF
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                100% Original Quality Guarantee &bull; Lossless Vector Decryption
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
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
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
            {!isProcessing && (
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* 100% Original Quality Info */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1.5">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>100% Original Quality Guaranteed</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Decryption is performed directly on the document streams without rasterization or downsampling.
            Vector text remains 100% sharp and selectable, and all original images, fonts, and layouts are preserved bit-for-bit.
          </p>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2 py-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                <span>{progressStatus || 'Processing...'}</span>
              </span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Action button */}
        {!downloadUrl && (
          <button
            id="unlock-process-btn"
            onClick={processUnlock}
            disabled={!file || isProcessing}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-rose-500/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Unlocking PDF...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Remove Password & Unlock PDF</span>
              </>
            )}
          </button>
        )}

        {/* Result & Download Card */}
        {downloadUrl && (
          <div
            id="unlock-result-card"
            className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  PDF Unlocked Successfully!
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Size: {formatBytes(unlockedSizeBytes)} &bull; 100% original quality preserved &bull; Restrictions removed.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                id="unlock-download-link"
                href={downloadUrl}
                download={downloadFileName}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Unlocked PDF</span>
              </a>
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
              >
                Unlock Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
