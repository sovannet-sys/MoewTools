import { PDFDocument } from 'pdf-lib';

export interface MergeInputFile {
  id: string;
  file: File;
  pageCount?: number;
}

export interface MergeResult {
  mergedBytes: Uint8Array;
  totalPages: number;
  fileCount: number;
  originalTotalSize: number;
  mergedSize: number;
}

export interface MergeOptions {
  onProgress?: (percent: number, status: string) => void;
}

/**
 * Quickly inspects a PDF buffer to determine its page count without rendering.
 */
export async function inspectPdfPageCount(bytes: ArrayBuffer | Uint8Array): Promise<number> {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return 1;
  }
}

/**
 * Combines multiple PDF documents into a single PDF document in sequential order.
 * Preserves 100% of the original vector graphics, typography, embedded images, and layouts.
 */
export async function mergePdfFiles(
  items: { name: string; bytes: ArrayBuffer | Uint8Array }[],
  options?: MergeOptions
): Promise<MergeResult> {
  if (!items || items.length === 0) {
    throw new Error('No PDF files provided to merge.');
  }

  if (items.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge together.');
  }

  options?.onProgress?.(5, 'Initializing document merger...');

  const mergedDoc = await PDFDocument.create();
  let totalOriginalSize = 0;
  let totalCopiedPages = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemSize = item.bytes.byteLength || (item.bytes as Uint8Array).length;
    totalOriginalSize += itemSize;

    const basePct = 10 + Math.round((i / items.length) * 80);
    options?.onProgress?.(
      basePct,
      `Loading file ${i + 1} of ${items.length}: "${item.name}"...`
    );

    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('encrypt')) {
        throw new Error(
          `Document "${item.name}" is password-protected. Please unlock it using the "Unlock PDF" tool before merging.`
        );
      }
      throw new Error(`Failed to load "${item.name}": ${msg}`);
    }

    const pageIndices = doc.getPageIndices();
    if (pageIndices.length === 0) {
      continue;
    }

    options?.onProgress?.(
      basePct + Math.round(40 / items.length),
      `Copying ${pageIndices.length} page(s) from "${item.name}"...`
    );

    const copiedPages = await mergedDoc.copyPages(doc, pageIndices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
      totalCopiedPages++;
    }
  }

  options?.onProgress?.(92, 'Finalizing merged document streams...');
  const mergedBytes = await mergedDoc.save({ useObjectStreams: true });

  options?.onProgress?.(100, 'PDF merge completed successfully!');

  return {
    mergedBytes,
    totalPages: totalCopiedPages,
    fileCount: items.length,
    originalTotalSize: totalOriginalSize,
    mergedSize: mergedBytes.length,
  };
}
