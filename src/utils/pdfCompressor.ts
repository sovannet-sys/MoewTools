import { PDFDocument, PDFName } from 'pdf-lib';
import { CompressionTier } from '../types';

export interface CompressionResult {
  pdfBytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  tier: CompressionTier;
  isVectorPreserved: boolean;
}

export interface CompressionOptions {
  onProgress?: (percent: number, status: string) => void;
}

export const TIER_LIMITS: Record<
  CompressionTier,
  { label: string; desc: string; expectedRange: string; isVectorPreserved: boolean }
> = {
  low: {
    label: 'Low Compression',
    desc: 'Lossless stream packing & metadata cleanup. 100% sharp vector text.',
    expectedRange: '15% – 50%',
    isVectorPreserved: true,
  },
  medium: {
    label: 'Medium (Balanced)',
    desc: 'High-res optimization for email & portals. Great balance of clarity and size.',
    expectedRange: '45% – 70%',
    isVectorPreserved: false,
  },
  high: {
    label: 'High (Maximum)',
    desc: 'Aggressive compression for tight upload limits & archival.',
    expectedRange: '70% – 90%',
    isVectorPreserved: false,
  },
};

/**
 * Strips heavy metadata, piece info, structure trees, and thumbnails from a PDF
 * while keeping all page content, fonts, and vector operators intact.
 */
function stripRedundantMetadata(pdfDoc: PDFDocument) {
  try {
    // Delete non-essential catalog entries that inflate file size
    pdfDoc.catalog.delete(PDFName.of('Metadata'));
    pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
    pdfDoc.catalog.delete(PDFName.of('StructTreeRoot'));
    pdfDoc.catalog.delete(PDFName.of('MarkInfo'));
    pdfDoc.catalog.delete(PDFName.of('Thumb'));
  } catch {
    // Ignore if not present
  }

  // Set lightweight standardized document info
  try {
    pdfDoc.setTitle('Document');
    pdfDoc.setProducer('Moew Tools Engine');
    pdfDoc.setCreator('Moew Tools');
  } catch {
    // Ignore
  }
}

/**
 * Compresses a PDF using standards-compliant techniques:
 * - Low: Pure lossless PDF stream deflating, object stream packing, and metadata cleaning.
 *        Guarantees 100% vector fidelity and valid PDF structure.
 * - Medium & High: Uses high-fidelity downsampling via pdfjs canvas when available,
 *                  re-encoded into clean standard PDF pages.
 *
 * All output files are generated exclusively via PDFDocument.save() to ensure
 * they are 100% valid and open cleanly in all PDF readers (Acrobat, Chrome, Preview, etc.).
 */
export async function compressPdf(
  inputBytes: ArrayBuffer | Uint8Array,
  tier: CompressionTier = 'low',
  options?: CompressionOptions
): Promise<CompressionResult> {
  const origBytes = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
  const originalSize = origBytes.length;

  options?.onProgress?.(15, 'Loading and parsing PDF structures...');

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(origBytes, { ignoreEncryption: true });
  } catch {
    pdfDoc = await PDFDocument.load(origBytes);
  }

  const pageCount = pdfDoc.getPageCount();

  options?.onProgress?.(35, 'Cleaning metadata packets & optimizing streams...');
  stripRedundantMetadata(pdfDoc);

  let finalPdfBytes: Uint8Array;
  const isVectorPreserved = tier === 'low';

  if (tier === 'low') {
    // Tier LOW: Pure vector & lossless optimization
    options?.onProgress?.(65, 'Packing indirect objects into compressed object streams...');

    // PDF-Lib's useObjectStreams groups indirect objects into compressed Flate streams
    finalPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    options?.onProgress?.(90, 'Finalizing vector document package...');
  } else {
    // Tier MEDIUM or HIGH: Visual optimization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs = typeof window !== 'undefined' ? (window as any).pdfjsLib : null;

    if (pdfjs) {
      options?.onProgress?.(45, 'Optimizing page resolutions and visual layers...');

      const scale = tier === 'medium' ? 1.75 : 1.25;
      const jpegQuality = tier === 'medium' ? 0.78 : 0.58;

      const task = pdfjs.getDocument({ data: origBytes.slice(0) });
      const pdfJsDoc = await task.promise;
      const totalPages = pdfJsDoc.numPages;

      const optimizedDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const pct = Math.min(45 + Math.round((i / totalPages) * 45), 90);
        options?.onProgress?.(pct, `Optimizing page ${i} of ${totalPages}...`);

        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not initialize canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const imgDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        const embeddedImage = await optimizedDoc.embedJpg(imgDataUrl);

        const newPage = optimizedDoc.addPage([viewport.width / scale, viewport.height / scale]);
        newPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: newPage.getWidth(),
          height: newPage.getHeight(),
        });
      }

      stripRedundantMetadata(optimizedDoc);
      options?.onProgress?.(92, 'Generating optimized PDF structure...');

      finalPdfBytes = await optimizedDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
    } else {
      // Fallback if pdfjs is not present: lossless stream packing
      options?.onProgress?.(70, 'Packing object streams...');
      finalPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
    }
  }

  // Safety check: if compression did not reduce size (e.g. already compressed file),
  // return whichever valid PDF is smaller
  if (finalPdfBytes.length > originalSize) {
    // If saving with object streams actually increased size slightly (due to new headers on small files),
    // save without object streams
    const alternativeSave = await pdfDoc.save({ useObjectStreams: false });
    if (alternativeSave.length < finalPdfBytes.length) {
      finalPdfBytes = alternativeSave;
    }
  }

  const compressedSize = finalPdfBytes.length;
  const reductionPercentage =
    originalSize > compressedSize
      ? Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10
      : 0;

  options?.onProgress?.(100, 'Optimization complete!');

  return {
    pdfBytes: finalPdfBytes,
    originalSize,
    compressedSize,
    reductionPercentage,
    tier,
    isVectorPreserved,
  };
}
