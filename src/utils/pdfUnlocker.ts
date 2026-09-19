import { PDFDocument } from 'pdf-lib';
import { decryptPDF, isEncrypted } from '@pdfsmaller/pdf-decrypt';

export interface UnlockResult {
  unlockedBytes: Uint8Array;
  originalSize: number;
  unlockedSize: number;
  isAlreadyDecrypted: boolean;
  strategyUsed: 'direct-decrypt' | 'canvas-reconstruct';
}

export interface UnlockOptions {
  customPassword?: string;
  onProgress?: (percent: number, status: string) => void;
}

const COMMON_CANDIDATE_PASSWORDS = [
  '',
  '123456',
  '1234',
  '12345',
  'password',
  'admin',
  'user',
  'owner',
  'pdf',
  'open',
  'test',
  'pass',
];

/**
 * Checks whether a PDF buffer is encrypted using PDF-Lib's parser
 * and trailer examination without crashing on unsupported ciphers.
 */
async function checkPdfEncryption(bytes: Uint8Array): Promise<boolean> {
  try {
    // PDF-Lib will throw 'Input document is encrypted' if an /Encrypt dictionary is present
    await PDFDocument.load(bytes);
    return false;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('encrypted')) {
      return true;
    }
  }

  // Fallback check: Search trailer for /Encrypt dictionary
  try {
    const tail = new TextDecoder('latin1').decode(bytes.slice(Math.max(0, bytes.length - 8192)));
    if (/\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(tail)) {
      return true;
    }
  } catch {
    // Ignore
  }

  return false;
}

/**
 * Unlocks a password-protected or permissions-restricted PDF document.
 * 1. Checks if document is encrypted safely without throwing on V=4, R=4.
 * 2. Attempts cryptographic stream decryption using @pdfsmaller/pdf-decrypt (AES-256 / RC4).
 * 3. Gracefully falls back to the Mozilla PDF.js engine for AES-128 (V=4, R=4) and
 *    proprietary DRM/permissions locks, ensuring all encryption algorithms are supported.
 */
export async function unlockPdf(
  inputBytes: ArrayBuffer | Uint8Array,
  options?: UnlockOptions
): Promise<UnlockResult> {
  const origBytes = inputBytes instanceof Uint8Array ? inputBytes : new Uint8Array(inputBytes);
  const originalSize = origBytes.length;

  options?.onProgress?.(10, 'Scanning PDF encryption headers & security dictionary...');

  // 1. Safe encryption check
  const isDocEncrypted = await checkPdfEncryption(origBytes);

  // If document is not encrypted, simply ensure any leftover restriction flags are removed
  if (!isDocEncrypted) {
    options?.onProgress?.(50, 'Document has no password lock. Cleaning permissions...');
    const doc = await PDFDocument.load(origBytes, { ignoreEncryption: true });
    const cleanBytes = await doc.save({ useObjectStreams: true });
    options?.onProgress?.(100, 'Document verified and unencrypted!');
    return {
      unlockedBytes: cleanBytes,
      originalSize,
      unlockedSize: cleanBytes.length,
      isAlreadyDecrypted: true,
      strategyUsed: 'direct-decrypt',
    };
  }

  options?.onProgress?.(25, 'Encrypted PDF detected. Preparing decryption keys...');

  // Build password candidate list
  const userPwd = options?.customPassword ? options.customPassword.trim() : '';
  const candidatePasswords: string[] = [];
  if (userPwd) {
    candidatePasswords.push(userPwd);
  }
  for (const cand of COMMON_CANDIDATE_PASSWORDS) {
    if (!candidatePasswords.includes(cand)) {
      candidatePasswords.push(cand);
    }
  }

  // Strategy 1: Cryptographic Decryption via @pdfsmaller/pdf-decrypt
  // Handles AES-256 and RC4 losslessly.
  // Wrapped in try/catch to safely handle V=4, R=4 (AES-128) without aborting!
  let decryptedBytes: Uint8Array | null = null;
  try {
    const encStatus = await isEncrypted(origBytes);
    if (encStatus.encrypted) {
      for (let i = 0; i < candidatePasswords.length; i++) {
        const pwd = candidatePasswords[i];
        try {
          options?.onProgress?.(
            Math.min(30 + Math.round((i / candidatePasswords.length) * 35), 65),
            `Checking security keys${pwd ? ' with provided password' : ''}...`
          );

          const res = await decryptPDF(origBytes, pwd);
          if (res && res.length > 0) {
            const verified = await PDFDocument.load(res);
            if (verified.getPageCount() > 0) {
              decryptedBytes = res;
              break;
            }
          }
        } catch {
          // Continue to next password candidate
        }
      }
    }
  } catch (cipherErr) {
    // If cipher is V=4, R=4 (AES-128) or unsupported by pdf-decrypt,
    // we safely log and proceed to Strategy 2 (PDF.js engine)!
    console.info('Direct cryptographic cipher not handled by pdf-decrypt, proceeding to PDF.js engine:', cipherErr);
  }

  if (decryptedBytes) {
    options?.onProgress?.(90, 'Repackaging clean unencrypted PDF streams...');
    const doc = await PDFDocument.load(decryptedBytes);
    const finalBytes = await doc.save({ useObjectStreams: true });

    options?.onProgress?.(100, 'PDF successfully unlocked without quality loss!');
    return {
      unlockedBytes: finalBytes,
      originalSize,
      unlockedSize: finalBytes.length,
      isAlreadyDecrypted: false,
      strategyUsed: 'direct-decrypt',
    };
  }

  // Strategy 2: High-Resolution Engine via Mozilla PDF.js
  // PDF.js fully supports V=4, R=4 (AES-128), AES-256, RC4, and owner-permission locks!
  options?.onProgress?.(65, 'Decrypting via PDF.js universal security engine...');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs = typeof window !== 'undefined' ? (window as any).pdfjsLib : null;

  if (pdfjs) {
    let pdfJsDoc = null;
    for (const pwd of candidatePasswords) {
      try {
        const task = pdfjs.getDocument({
          data: origBytes.slice(0),
          password: pwd,
        });
        pdfJsDoc = await task.promise;
        if (pdfJsDoc) break;
      } catch {
        // Try next password candidate
      }
    }

    if (!pdfJsDoc) {
      throw new Error(
        'This document is locked with a custom password. Please enter the password in the password field and try again.'
      );
    }

    const totalPages = pdfJsDoc.numPages;
    const reconstructedDoc = await PDFDocument.create();

    for (let i = 1; i <= totalPages; i++) {
      const pct = Math.min(70 + Math.round((i / totalPages) * 25), 96);
      options?.onProgress?.(pct, `Unlocking and rendering page ${i} of ${totalPages}...`);

      const page = await pdfJsDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2.25 }); // High-DPI scale for sharp rendering

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not initialize canvas context');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const embeddedImage = await reconstructedDoc.embedJpg(imgData);

      const newPage = reconstructedDoc.addPage([viewport.width / 2.25, viewport.height / 2.25]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: newPage.getWidth(),
        height: newPage.getHeight(),
      });
    }

    options?.onProgress?.(98, 'Packaging clean unlocked document...');
    const reconstructedBytes = await reconstructedDoc.save({ useObjectStreams: true });

    options?.onProgress?.(100, 'PDF successfully unlocked!');
    return {
      unlockedBytes: reconstructedBytes,
      originalSize,
      unlockedSize: reconstructedBytes.length,
      isAlreadyDecrypted: false,
      strategyUsed: 'canvas-reconstruct',
    };
  }

  // If in Node environment and pdf-decrypt didn't match password
  throw new Error(
    'This document is locked with a custom password. Please enter the password in the password field and try again.'
  );
}
