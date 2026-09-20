import React, { useState, useRef } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { ToolId } from '../types';
import { formatBytes } from '../utils/formatters';
import {
  convertImagesToPdf,
  ImageQuality,
  ImageToPdfResult,
  PageMargin,
  PageOrientation,
  PageSizeFormat,
  PictureItem,
} from '../utils/imageToPdf';
import { useLanguage } from '../context/LanguageContext';

interface ImageToPdfToolProps {
  onBack: (id: ToolId) => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({ onBack, onToast }) => {
  const { language } = useLanguage();
  const isKhmer = language === 'km';

  const [pictures, setPictures] = useState<PictureItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeFormat>('fit-image');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [margin, setMargin] = useState<PageMargin>('none');
  const [quality, setQuality] = useState<ImageQuality>('high');
  const [outputFileName, setOutputFileName] = useState('converted-pictures.pdf');

  const [isConverting, setIsConverting] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');

  const [result, setResult] = useState<ImageToPdfResult | null>(null);

  // Drag and drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif|svg|avif)$/i.test(file.name)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      onToast(
        isKhmer
          ? 'សូមជ្រើសរើសឯកសាររូបភាពត្រឹមត្រូវ (JPG, PNG, WebP, etc.)'
          : 'Please select valid image files (JPG, PNG, WebP, etc.).',
        true
      );
      return;
    }

    const newItems: PictureItem[] = [];

    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file);
      // Determine dimensions
      let width = 800;
      let height = 600;
      try {
        const dimensions = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => resolve({ w: 800, h: 600 });
          img.src = previewUrl;
        });
        width = dimensions.w;
        height = dimensions.h;
      } catch {
        // use fallback
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        file,
        previewUrl,
        width,
        height,
        sizeBytes: file.size,
      });
    }

    setPictures((prev) => [...prev, ...newItems]);
    setResult(null);

    onToast(
      isKhmer
        ? `បានបន្ថែមរូបភាព ${newItems.length} សន្លឹក`
        : `Added ${newItems.length} ${newItems.length === 1 ? 'image' : 'images'}.`
    );
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
      e.target.value = '';
    }
  };

  const handleDropzoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  // Drag and Drop reordering handlers
  const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (isConverting) return;
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
    const movedItem = pictures[sourceIndex];

    setPictures((prev) => {
      const next = [...prev];
      const [removed] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);

    if (movedItem) {
      onToast(
        isKhmer
          ? `បានប្តូរទីតាំងរូបភាព "${movedItem.file.name}" ទៅលេខ #${targetIndex + 1}`
          : `Moved "${movedItem.file.name}" to position #${targetIndex + 1}.`
      );
    }
  };

  const handleItemDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setPictures((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= pictures.length - 1) return;
    setPictures((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRemoveItem = (id: string) => {
    setPictures((prev) => prev.filter((p) => p.id !== id));
    setResult(null);
  };

  const handleClearAll = () => {
    pictures.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPictures([]);
    setResult(null);
  };

  const handleConvert = async () => {
    if (pictures.length === 0) {
      onToast(isKhmer ? 'សូមជ្រើសរើសរូបភាពយ៉ាងហោចណាស់មួយសន្លឹក' : 'Please select at least one image.', true);
      return;
    }

    setIsConverting(true);
    setProgressPercent(5);
    setProgressText(isKhmer ? 'កំពុងរៀបចំឯកសារ...' : 'Preparing images...');
    setResult(null);

    try {
      const res = await convertImagesToPdf(pictures, {
        pageSize,
        orientation,
        margin,
        quality,
        onProgress: (p) => {
          setProgressPercent(p.percent);
          setProgressText(
            isKhmer
              ? `កំពុងដំណើរការរូបភាព ${p.current} នៃ ${p.total}...`
              : `Processing picture ${p.current} of ${p.total}...`
          );
        },
      });

      setResult(res);
      onToast(
        isKhmer
          ? `បានបំប្លែងរូបភាព ${pictures.length} សន្លឹកទៅជា PDF ដោយជោគជ័យ!`
          : `Successfully converted ${pictures.length} pictures to PDF!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onToast(isKhmer ? `កំហុសក្នុងការបំប្លែង៖ ${msg}` : `Conversion error: ${msg}`, true);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.pdfUrl;
    let safeName = outputFileName.trim();
    if (!safeName.toLowerCase().endsWith('.pdf')) {
      safeName += '.pdf';
    }
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="image-to-pdf-tool-container" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-home"
          type="button"
          onClick={() => onBack('home')}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isKhmer ? 'ត្រឡប់ទៅឧបករណ៍ទាំងអស់' : 'Back to All Tools'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
            <Sparkles className="w-3 h-3" />
            <span>{isKhmer ? 'ដំណើរការក្នុងម៉ាស៊ីន 100%' : '100% Client-Side'}</span>
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Tool Header */}
        <div className="flex items-start space-x-4 border-b border-slate-100 dark:border-slate-700/60 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isKhmer ? 'បំប្លែងរូបភាពទៅជា PDF (Picture to PDF)' : 'Picture to PDF Converter'}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {isKhmer
                ? 'បំប្លែងរូបភាព JPG, PNG, WebP ទៅជាឯកសារ PDF គុណភាពខ្ពស់ ជាមួយការអូសរៀបចំលំដាប់ ជម្រើសទំហំទំព័រ និងគែម។'
                : 'Convert JPG, PNG, and photos into a high-quality PDF document with drag-and-drop reordering, custom margins, and orientation.'}
            </p>
          </div>
        </div>

        {/* Upload Dropzone */}
        {pictures.length === 0 ? (
          <div
            id="picture-dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropzoneDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-3xl p-10 sm:p-12 text-center transition-all bg-slate-50/50 dark:bg-slate-900/30 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10 cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.svg,.avif"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isKhmer ? 'ជ្រើសរើស ឬអូសទម្លាក់រូបភាពនៅទីនេះ' : 'Choose or drag & drop pictures here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {isKhmer
                ? 'គាំទ្រ JPG, JPEG, PNG, WebP, GIF, BMP, SVG។ អាចជ្រើសរើសរូបភាពច្រើនសន្លឹកក្នុងពេលតែមួយ។'
                : 'Supports JPG, PNG, WebP, GIF, BMP, and SVG. Select multiple pictures at once.'}
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition shadow-sm">
                <Plus className="w-3.5 h-3.5" />
                <span>{isKhmer ? 'ជ្រើសរើសរូបភាព' : 'Select Pictures'}</span>
              </span>
            </div>
          </div>
        ) : (
          /* Pictures Queue and Settings */
          <div className="space-y-6">
            {/* Action buttons header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white text-xs font-black flex items-center justify-center">
                  {pictures.length}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isKhmer
                    ? `រូបភាពបានជ្រើសរើស (${pictures.length} សន្លឹក)`
                    : `Pictures Selected (${pictures.length})`}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  ref={addMoreInputRef}
                  type="file"
                  multiple
                  accept="image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.svg,.avif"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <button
                  id="btn-add-more-pictures"
                  type="button"
                  disabled={isConverting}
                  onClick={() => addMoreInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'បន្ថែមរូបភាព' : 'Add More'}</span>
                </button>
                <button
                  id="btn-clear-all-pictures"
                  type="button"
                  disabled={isConverting}
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isKhmer ? 'សម្អាតទាំងអស់' : 'Clear All'}</span>
                </button>
              </div>
            </div>

            {/* Reorder Hint */}
            <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-cyan-50/60 dark:bg-cyan-950/30 px-3.5 py-2 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
              <GripVertical className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>
                {isKhmer ? (
                  <>
                    <strong>អូស និងទម្លាក់</strong> រូបភាពដើម្បីរៀបចំលំដាប់ទំព័រ ឬប្រើប្រាស់ប៊ូតុងព្រួញ។ រូបភាពខាងលើនឹងក្លាយជាទំព័រទី 1។
                  </>
                ) : (
                  <>
                    <strong>Drag and drop</strong> image cards to reorder pages, or use arrow buttons. The top image becomes page #1.
                  </>
                )}
              </span>
            </div>

            {/* Pictures List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {pictures.map((item, index) => {
                const isItemDragged = draggedIndex === index;
                const isItemOver = dragOverIndex === index && draggedIndex !== index;

                return (
                  <div
                    key={item.id}
                    id={`picture-item-${index}`}
                    draggable={!isConverting}
                    onDragStart={(e) => handleItemDragStart(e, index)}
                    onDragEnter={(e) => handleItemDragEnter(e, index)}
                    onDragOver={(e) => handleItemDragOver(e, index)}
                    onDragLeave={(e) => handleItemDragLeave(e, index)}
                    onDrop={(e) => handleItemDrop(e, index)}
                    onDragEnd={handleItemDragEnd}
                    className={`p-3 rounded-2xl flex items-center justify-between space-x-3 transition-all select-none ${
                      isItemDragged
                        ? 'opacity-40 border-2 border-dashed border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/40 scale-[0.99]'
                        : isItemOver
                        ? 'border-2 border-cyan-500 bg-cyan-100/70 dark:bg-cyan-900/50 ring-2 ring-cyan-500/30 shadow-md scale-[1.01]'
                        : 'bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-300 dark:hover:border-cyan-700/60 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <div
                        className="text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-grab active:cursor-grabbing p-0.5 rounded-md transition shrink-0"
                        title={isKhmer ? 'អូសដើម្បីរៀបចំលំដាប់' : 'Drag to reorder'}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Index badge */}
                      <span className="w-6 h-6 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Thumbnail Image */}
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* File Details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{formatBytes(item.sizeBytes)}</span>
                          <span>&bull;</span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {item.width} &times; {item.height} px
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reorder and remove controls */}
                    <div
                      className="flex items-center space-x-1 shrink-0"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={index === 0 || isConverting}
                        onClick={() => handleMoveUp(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        title={isKhmer ? 'រំកិលឡើងលើ' : 'Move Up'}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === pictures.length - 1 || isConverting}
                        onClick={() => handleMoveDown(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                        title={isKhmer ? 'រំកិលចុះក្រោម' : 'Move Down'}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title={isKhmer ? 'លុបរូបភាពនេះ' : 'Remove image'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion Settings Section */}
            <div className="bg-slate-50/70 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                {isKhmer ? 'ការកំណត់ទំព័រ PDF (Page Settings)' : 'PDF Page Setup'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Page Size */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isKhmer ? 'ទំហំទំព័រ (Page Size)' : 'Page Size'}
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as PageSizeFormat)}
                    disabled={isConverting}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="fit-image">
                      {isKhmer ? 'តាមទំហំរូបភាព (Fit Image 1:1)' : 'Fit Image (1:1 Aspect)'}
                    </option>
                    <option value="a4">A4 (210 &times; 297 mm)</option>
                    <option value="letter">US Letter (8.5 &times; 11 in)</option>
                  </select>
                </div>

                {/* Orientation (only if not fit-image) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isKhmer ? 'ទិសដៅទំព័រ (Orientation)' : 'Orientation'}
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                    disabled={pageSize === 'fit-image' || isConverting}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-40"
                  >
                    <option value="auto">{isKhmer ? 'ស្វ័យប្រវត្តិ (Auto-detect)' : 'Auto-detect'}</option>
                    <option value="portrait">{isKhmer ? 'បញ្ឈរ (Portrait)' : 'Portrait'}</option>
                    <option value="landscape">{isKhmer ? 'ផ្តេក (Landscape)' : 'Landscape'}</option>
                  </select>
                </div>

                {/* Margins */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isKhmer ? 'គែមទំព័រ (Margin)' : 'Margins'}
                  </label>
                  <select
                    value={margin}
                    onChange={(e) => setMargin(e.target.value as PageMargin)}
                    disabled={pageSize === 'fit-image' || isConverting}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-40"
                  >
                    <option value="none">{isKhmer ? 'គ្មាន (Full Bleed - 0mm)' : 'No Margin (0 mm)'}</option>
                    <option value="small">{isKhmer ? 'តូច (Small - 7mm)' : 'Small (7 mm)'}</option>
                    <option value="medium">{isKhmer ? 'មធ្យម (Medium - 14mm)' : 'Medium (14 mm)'}</option>
                  </select>
                </div>

                {/* Quality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isKhmer ? 'គុណភាពរូបភាព (Quality)' : 'Image Quality'}
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as ImageQuality)}
                    disabled={isConverting}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="high">{isKhmer ? 'គុណភាពខ្ពស់ (High - 90%)' : 'High Quality (90%)'}</option>
                    <option value="medium">{isKhmer ? 'មធ្យម (Balanced - 78%)' : 'Balanced (78%)'}</option>
                    <option value="low">{isKhmer ? 'បង្រួមទំហំ (Compact - 60%)' : 'Compact (60%)'}</option>
                    <option value="original">{isKhmer ? 'ទំហំដើម (Original)' : 'Original (95%)'}</option>
                  </select>
                </div>
              </div>

              {/* Output File Name */}
              <div className="pt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isKhmer ? 'ឈ្មោះឯកសារ PDF ចេញ (Output Name)' : 'PDF File Name'}
                </label>
                <div className="flex items-center space-x-2 max-w-sm">
                  <input
                    type="text"
                    value={outputFileName}
                    onChange={(e) => setOutputFileName(e.target.value)}
                    disabled={isConverting}
                    placeholder="pictures.pdf"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Conversion Progress Bar */}
            {isConverting && (
              <div className="bg-cyan-50 dark:bg-cyan-950/40 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-800 dark:text-cyan-200">
                  <span className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                    <span>{progressText}</span>
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-cyan-100 dark:bg-cyan-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Convert Button */}
            {!result && (
              <div className="flex justify-end pt-2">
                <button
                  id="btn-convert-to-pdf"
                  type="button"
                  disabled={isConverting || pictures.length === 0}
                  onClick={handleConvert}
                  className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-all shadow-md shadow-cyan-600/25 flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKhmer ? 'កំពុងបំប្លែង...' : 'Converting...'}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>
                        {isKhmer
                          ? `បំប្លែងរូបភាព ${pictures.length} សន្លឹកទៅជា PDF`
                          : `Convert ${pictures.length} ${pictures.length === 1 ? 'Picture' : 'Pictures'} to PDF`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-6 rounded-3xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {isKhmer ? 'ការបំប្លែងជោគជ័យ!' : 'PDF Created Successfully!'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {isKhmer
                          ? `ឯកសារ PDF រួចរាល់ជាមួយ ${result.pageCount} ទំព័រ (${formatBytes(result.totalSizeBytes)})`
                          : `Your PDF document is ready with ${result.pageCount} pages (${formatBytes(result.totalSizeBytes)}).`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    id="btn-download-converted-pdf"
                    type="button"
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/25 flex items-center space-x-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isKhmer ? 'ទាញយកឯកសារ PDF' : 'Download PDF'}</span>
                  </button>

                  <a
                    id="btn-preview-converted-pdf"
                    href={result.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'បើកមើលក្នុងផ្ទាំងថ្មី' : 'Open in New Tab'}</span>
                  </a>

                  <button
                    id="btn-convert-another-batch"
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isKhmer ? 'កែប្រែការកំណត់' : 'Change Settings'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
