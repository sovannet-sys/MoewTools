import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileText,
  Files,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { ToolId } from '../types';
import { formatBytes } from '../utils/formatters';
import { inspectPdfPageCount, mergePdfFiles } from '../utils/pdfMerger';

interface MergePdfToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

interface QueuedFile {
  id: string;
  file: File;
  pageCount: number | null;
}

export const MergePdfTool: React.FC<MergePdfToolProps> = ({ onBack, onToast }) => {
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [outputFileName, setOutputFileName] = useState('merged_document.pdf');
  const [isMerging, setIsMerging] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>('');
  const [mergedStats, setMergedStats] = useState<{
    fileCount: number;
    totalPages: number;
    mergedSize: number;
  } | null>(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (files: FileList | File[]) => {
    const validPdfFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        validPdfFiles.push(f);
      }
    }

    if (validPdfFiles.length === 0) {
      onToast('Please select valid PDF files.', true);
      return;
    }

    const newEntries: QueuedFile[] = validPdfFiles.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      pageCount: null,
    }));

    setFileQueue((prev) => [...prev, ...newEntries]);
    setDownloadUrl(null);
    setMergedStats(null);
    onToast(`Added ${validPdfFiles.length} file(s) to merge queue.`);

    // Asynchronously inspect page counts
    for (const entry of newEntries) {
      try {
        const buffer = await entry.file.arrayBuffer();
        const pages = await inspectPdfPageCount(buffer);
        setFileQueue((current) =>
          current.map((item) => (item.id === entry.id ? { ...item, pageCount: pages } : item))
        );
      } catch {
        // Leave page count null if inspection fails
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFileQueue((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= fileQueue.length - 1) return;
    setFileQueue((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (isMerging) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleItemDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleItemDragLeave = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const sourceIndex = draggedIndex;
    const movedItemName = fileQueue[sourceIndex]?.file.name;

    setFileQueue((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(sourceIndex, 1);
      newQueue.splice(targetIndex, 0, removed);
      return newQueue;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (movedItemName) {
      onToast(`Moved "${movedItemName}" to position #${targetIndex + 1}.`);
    }
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemoveFile = (id: string) => {
    setFileQueue((prev) => prev.filter((f) => f.id !== id));
    setDownloadUrl(null);
    setMergedStats(null);
  };

  const handleClearAll = () => {
    setFileQueue([]);
    setDownloadUrl(null);
    setMergedStats(null);
    setIsMerging(false);
    setProgressPercent(0);
    setProgressStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
  };

  const handleMerge = async () => {
    if (fileQueue.length < 2) {
      onToast('Please add at least 2 PDF files to merge.', true);
      return;
    }

    setIsMerging(true);
    setProgressPercent(5);
    setProgressStatus('Reading PDF buffers...');

    try {
      // Read all files
      const itemsToMerge: { name: string; bytes: ArrayBuffer }[] = [];
      for (let i = 0; i < fileQueue.length; i++) {
        const item = fileQueue[i];
        setProgressStatus(`Loading "${item.file.name}"...`);
        const bytes = await item.file.arrayBuffer();
        itemsToMerge.push({ name: item.file.name, bytes });
      }

      const result = await mergePdfFiles(itemsToMerge, {
        onProgress: (percent, status) => {
          setProgressPercent(percent);
          setProgressStatus(status);
        },
      });

      // Prepare downloadable blob
      const exactBuffer = result.mergedBytes.buffer.slice(
        result.mergedBytes.byteOffset,
        result.mergedBytes.byteOffset + result.mergedBytes.byteLength
      );
      const blob = new Blob([exactBuffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      let finalName = outputFileName.trim();
      if (!finalName.toLowerCase().endsWith('.pdf')) {
        finalName += '.pdf';
      }

      setDownloadUrl(url);
      setDownloadFileName(finalName || 'merged_document.pdf');
      setMergedStats({
        fileCount: result.fileCount,
        totalPages: result.totalPages,
        mergedSize: result.mergedSize,
      });

      setProgressStatus('Merge Completed!');
      onToast(`Successfully merged ${result.fileCount} PDFs into ${result.totalPages} pages!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to merge PDF files.';
      onToast(msg, true);
      setProgressStatus('');
      setProgressPercent(0);
    } finally {
      setIsMerging(false);
    }
  };

  const totalCalculatedPages = fileQueue.reduce((sum, item) => sum + (item.pageCount || 0), 0);
  const allPagesKnown = fileQueue.length > 0 && fileQueue.every((item) => item.pageCount !== null);

  return (
    <div id="merge-pdf-tool-container" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        id="btn-back-to-home"
        onClick={() => onBack('home')}
        className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Tools</span>
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Files className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Merge PDF Files
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Combine multiple PDF documents into a single file in any order with 100% original vector quality
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
              Lossless Merge
            </span>
          </div>
        </div>
      </div>

      {/* Main interactive area */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-6">
        {/* Dropzone */}
        <div
          id="merge-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all rounded-3xl p-8 sm:p-10 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 group"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Click to upload or drag & drop multiple PDF files
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select 2 or more PDFs &bull; Supports unlimited pages &bull; 100% Client-Side Privacy
          </p>
          <input
            id="merge-file-input"
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesAdded(e.target.files);
              }
            }}
          />
        </div>

        {/* Hidden input for "Add More Files" */}
        <input
          id="merge-add-more-input"
          ref={addMoreInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesAdded(e.target.files);
            }
          }}
        />

        {/* File Queue Section */}
        {fileQueue.length > 0 && (
          <div id="merge-queue-container" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Document Queue
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {fileQueue.length} {fileQueue.length === 1 ? 'file' : 'files'}
                  {allPagesKnown && ` \u2022 ${totalCalculatedPages} pages total`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="btn-add-more-files"
                  type="button"
                  onClick={() => addMoreInputRef.current?.click()}
                  disabled={isMerging}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
                <button
                  id="btn-clear-all-files"
                  type="button"
                  onClick={handleClearAll}
                  disabled={isMerging}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {/* Helpful hint for drag-and-drop */}
            <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-blue-50/60 dark:bg-blue-950/30 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <GripVertical className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Drag and drop</strong> file cards to reorder them, or use the arrow buttons. Files merge top to bottom.
              </span>
            </div>

            {/* List of files in queue */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {fileQueue.map((item, index) => {
                const isItemDragged = draggedIndex === index;
                const isItemOver = dragOverIndex === index && draggedIndex !== index;

                return (
                  <div
                    key={item.id}
                    id={`queue-item-${index}`}
                    draggable={!isMerging}
                    onDragStart={(e) => handleItemDragStart(e, index)}
                    onDragEnter={(e) => handleItemDragEnter(e, index)}
                    onDragOver={(e) => handleItemDragOver(e, index)}
                    onDragLeave={(e) => handleItemDragLeave(e, index)}
                    onDrop={(e) => handleItemDrop(e, index)}
                    onDragEnd={handleItemDragEnd}
                    className={`p-3.5 rounded-2xl flex items-center justify-between space-x-3 transition-all select-none ${
                      isItemDragged
                        ? 'opacity-40 border-2 border-dashed border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 scale-[0.99]'
                        : isItemOver
                        ? 'border-2 border-blue-500 bg-blue-100/70 dark:bg-blue-900/50 ring-2 ring-blue-500/30 shadow-md scale-[1.01]'
                        : 'bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700/60 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <div
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-grab active:cursor-grabbing p-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition shrink-0"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{formatBytes(item.file.size)}</span>
                          {item.pageCount !== null && (
                            <>
                              <span>&bull;</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reorder and remove buttons */}
                    <div className="flex items-center space-x-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                      <button
                        id={`btn-move-up-${index}`}
                        type="button"
                        disabled={index === 0 || isMerging}
                        onClick={() => handleMoveUp(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-move-down-${index}`}
                        type="button"
                        disabled={index === fileQueue.length - 1 || isMerging}
                        onClick={() => handleMoveDown(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-remove-file-${index}`}
                        type="button"
                        disabled={isMerging}
                        onClick={() => handleRemoveFile(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Output configuration */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Output File Name
                </label>
                <input
                  id="merge-output-filename-input"
                  type="text"
                  value={outputFileName}
                  onChange={(e) => setOutputFileName(e.target.value)}
                  placeholder="merged_document.pdf"
                  disabled={isMerging}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                  Merged file maintains 100% original vector typography, embedded image clarity, and bookmarks without quality loss.
                </p>
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                id="btn-merge-action"
                type="button"
                onClick={handleMerge}
                disabled={isMerging || fileQueue.length < 2}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Merging {fileQueue.length} Files...</span>
                  </>
                ) : (
                  <>
                    <Files className="w-4 h-4" />
                    <span>Merge {fileQueue.length} PDF Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isMerging && (
          <div id="merge-progress-container" className="space-y-2 p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50">
            <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-200">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>{progressStatus || 'Merging documents...'}</span>
              </div>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900/50 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Success / Download Card */}
        {downloadUrl && mergedStats && !isMerging && (
          <div
            id="merge-success-card"
            className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl space-y-4 animate-in fade-in"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  PDF Documents Merged Successfully!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Combined {mergedStats.fileCount} PDFs &bull; {mergedStats.totalPages} total pages &bull; Output size: {formatBytes(mergedStats.mergedSize)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                id="btn-download-merged-pdf"
                href={downloadUrl}
                download={downloadFileName}
                className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition cursor-pointer text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Merged PDF ({formatBytes(mergedStats.mergedSize)})</span>
              </a>
              <button
                id="btn-merge-another"
                type="button"
                onClick={handleClearAll}
                className="py-3.5 px-5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs transition cursor-pointer"
              >
                Merge More Files
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
