import JSZip from 'jszip';

export interface RenderedPageImage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
}

export type PngDpiScale = 1 | 2 | 3;

export interface PdfToPngOptions {
  scale?: PngDpiScale;
  pageRange?: 'all' | { start: number; end: number };
  onProgress?: (percent: number, status: string, currentPage?: number, totalPages?: number) => void;
}

export interface PdfToPngResult {
  pages: RenderedPageImage[];
  totalPages: number;
  fileName: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPdfJsLib(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  try {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return pdfjs;
  } catch (err) {
    throw new Error(`PDF rendering engine failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Converts pages of a PDF document to crisp PNG images.
 */
export async function convertPdfToPng(
  fileBytes: ArrayBuffer | Uint8Array,
  fileName: string,
  options?: PdfToPngOptions
): Promise<PdfToPngResult> {
  const scale = options?.scale ?? 2;
  const pdfjs = await getPdfJsLib();

  options?.onProgress?.(5, 'Loading PDF document...');

  const dataCopy = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
  const loadingTask = pdfjs.getDocument({
    data: dataCopy.slice(0),
    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
    cMapPacked: true,
  });

  let pdfDoc;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new Error(
        'This document is password-protected. Please unlock it with the "Unlock PDF" tool first.'
      );
    }
    throw new Error(`Failed to load PDF document: ${msg}`);
  }

  const numPages: number = pdfDoc.numPages;
  const pages: RenderedPageImage[] = [];

  let startPage = 1;
  let endPage = numPages;

  if (options?.pageRange && options.pageRange !== 'all') {
    startPage = Math.max(1, Math.min(options.pageRange.start, numPages));
    endPage = Math.max(startPage, Math.min(options.pageRange.end, numPages));
  }

  const totalToRender = endPage - startPage + 1;

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const currentIndex = pageNum - startPage + 1;
    const pct = Math.min(10 + Math.round((currentIndex / totalToRender) * 85), 95);

    options?.onProgress?.(
      pct,
      `Rendering page ${pageNum} of ${numPages} (${scale}x resolution)...`,
      currentIndex,
      totalToRender
    );

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Canvas 2D context could not be initialized.');
    }

    // Set solid white background for transparency prevention
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to create PNG blob for page ${pageNum}`));
      }, 'image/png');
    });

    const dataUrl = canvas.toDataURL('image/png');

    pages.push({
      pageNumber: pageNum,
      dataUrl,
      blob,
      width: canvas.width,
      height: canvas.height,
      sizeBytes: blob.size,
    });
  }

  options?.onProgress?.(100, `Successfully converted ${pages.length} page(s) to PNG!`);

  return {
    pages,
    totalPages: numPages,
    fileName,
  };
}

/**
 * Creates a downloadable ZIP containing all rendered PNG pages.
 */
export async function createPngZipArchive(
  pages: RenderedPageImage[],
  baseFileName: string,
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const cleanBase = baseFileName.replace(/\.[^/.]+$/, '');
  const folder = zip.folder(cleanBase) || zip;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const padIndex = String(p.pageNumber).padStart(String(pages.length).length, '0');
    folder.file(`${cleanBase}-page-${padIndex}.png`, p.blob);
  }

  return await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onZipProgress?.(Math.round(metadata.percent));
    }
  );
}
