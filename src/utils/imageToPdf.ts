import { PDFDocument } from 'pdf-lib';

export type PageSizeFormat = 'fit-image' | 'a4' | 'letter';
export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type PageMargin = 'none' | 'small' | 'medium';
export type ImageQuality = 'original' | 'high' | 'medium' | 'low';

export interface PictureItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ImageToPdfOptions {
  pageSize: PageSizeFormat;
  orientation: PageOrientation;
  margin: PageMargin;
  quality: ImageQuality;
  onProgress?: (progress: { current: number; total: number; percent: number }) => void;
}

export interface ImageToPdfResult {
  pdfBlob: Blob;
  pdfUrl: string;
  pageCount: number;
  totalSizeBytes: number;
}

const PAGE_DIMENSIONS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
};

const MARGIN_SIZES = {
  none: 0,
  small: 20, // ~7mm
  medium: 40, // ~14mm
};

/**
 * Loads an image from Blob or Object URL into an HTMLImageElement
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = url;
  });
}

/**
 * Converts an image to JPEG or PNG bytes using an in-memory canvas
 */
async function prepareImageBytes(
  img: HTMLImageElement,
  file: File,
  qualitySetting: ImageQuality
): Promise<{ bytes: Uint8Array; isJpg: boolean }> {
  // If original file is already JPEG and user chose 'original', we can use direct arrayBuffer
  const isOriginalJpg =
    file.type === 'image/jpeg' || file.type === 'image/jpg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');

  if (isOriginalJpg && qualitySetting === 'original') {
    const buf = await file.arrayBuffer();
    return { bytes: new Uint8Array(buf), isJpg: true };
  }

  // Draw to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas 2D rendering context');
  }

  // White background in case image has transparency (for JPEG)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  let qualityNumber = 0.92;
  if (qualitySetting === 'high') qualityNumber = 0.90;
  if (qualitySetting === 'medium') qualityNumber = 0.78;
  if (qualitySetting === 'low') qualityNumber = 0.60;
  if (qualitySetting === 'original') qualityNumber = 0.95;

  // Convert to JPEG blob
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', qualityNumber);
  });

  if (!blob) {
    throw new Error('Canvas toBlob conversion failed');
  }

  const arrayBuffer = await blob.arrayBuffer();
  return { bytes: new Uint8Array(arrayBuffer), isJpg: true };
}

/**
 * Generates a PDF Document from a list of images with customizable page size, margin, and orientation.
 */
export async function convertImagesToPdf(
  items: PictureItem[],
  options: ImageToPdfOptions
): Promise<ImageToPdfResult> {
  if (items.length === 0) {
    throw new Error('No images provided for PDF conversion.');
  }

  const pdfDoc = await PDFDocument.create();
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    options.onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 0.5) / total) * 100),
    });

    const img = await loadImageElement(item.previewUrl);
    const imgWidth = img.naturalWidth || item.width || 800;
    const imgHeight = img.naturalHeight || item.height || 600;

    const { bytes, isJpg } = await prepareImageBytes(img, item.file, options.quality);

    let embeddedImage;
    if (isJpg) {
      embeddedImage = await pdfDoc.embedJpg(bytes);
    } else {
      try {
        embeddedImage = await pdfDoc.embedPng(bytes);
      } catch {
        // Fallback to JPG if PNG embedding encounters edge-case header
        const fallback = await prepareImageBytes(img, item.file, 'high');
        embeddedImage = await pdfDoc.embedJpg(fallback.bytes);
      }
    }

    // Determine Page Dimensions
    if (options.pageSize === 'fit-image') {
      // Each page fits the exact image dimensions
      const page = pdfDoc.addPage([imgWidth, imgHeight]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgWidth,
        height: imgHeight,
      });
    } else {
      // Standard page (A4 or Letter)
      const baseDim = PAGE_DIMENSIONS[options.pageSize];
      let pageWidth = baseDim.width;
      let pageHeight = baseDim.height;

      if (options.orientation === 'landscape') {
        pageWidth = Math.max(baseDim.width, baseDim.height);
        pageHeight = Math.min(baseDim.width, baseDim.height);
      } else if (options.orientation === 'portrait') {
        pageWidth = Math.min(baseDim.width, baseDim.height);
        pageHeight = Math.max(baseDim.width, baseDim.height);
      } else {
        // Auto: detect based on image aspect ratio
        if (imgWidth > imgHeight) {
          pageWidth = Math.max(baseDim.width, baseDim.height);
          pageHeight = Math.min(baseDim.width, baseDim.height);
        } else {
          pageWidth = Math.min(baseDim.width, baseDim.height);
          pageHeight = Math.max(baseDim.width, baseDim.height);
        }
      }

      const margin = MARGIN_SIZES[options.margin];
      const availWidth = Math.max(10, pageWidth - 2 * margin);
      const availHeight = Math.max(10, pageHeight - 2 * margin);

      const ratio = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      const drawWidth = imgWidth * ratio;
      const drawHeight = imgHeight * ratio;

      const drawX = margin + (availWidth - drawWidth) / 2;
      const drawY = margin + (availHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    options.onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const exactBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  );
  const pdfBlob = new Blob([exactBuffer as ArrayBuffer], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(pdfBlob);

  return {
    pdfBlob,
    pdfUrl,
    pageCount: total,
    totalSizeBytes: pdfBlob.size,
  };
}
