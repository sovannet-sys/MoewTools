import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { unlockPdf } from '../src/utils/pdfUnlocker';

const SAMPLE_PASSWORDS = [
  'secret2026',
  'admin',
  '123456',
  'password',
  'moew-tools',
  'confidential',
  'finance-q4',
  '1234',
  'user',
  'doc-pass',
  'super_secure_99',
  'office365',
];

async function generateSamplePdf(pageCount: number, index: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle(`Encrypted Test Document #${index}`);
  doc.setAuthor('Moew Tools Test Suite');

  for (let p = 1; p <= pageCount; p++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Confidential Page ${p} of ${pageCount}`, {
      x: 50,
      y: 800,
      size: 16,
      font: bold,
      color: rgb(0.8, 0.1, 0.1),
    });

    page.drawText(`Secure document body text #${index} - Page index: ${p}`, {
      x: 50,
      y: 770,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Vector line integrity check: ${new Date().toISOString()}`, {
      x: 50,
      y: 740,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  return await doc.save();
}

async function run100UnlockTests() {
  console.log('================================================================');
  console.log('    MOEW TOOLS - 100 PDF DECRYPTION & UNLOCK VERIFICATION TESTS  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (let i = 1; i <= 100; i++) {
    const pageCount = (i % 5) + 1;
    const isUnencryptedScenario = i % 10 === 0; // Every 10th test is an already-unencrypted document
    const password = SAMPLE_PASSWORDS[i % SAMPLE_PASSWORDS.length];

    const originalBytes = await generateSamplePdf(pageCount, i);

    let testBytes: Uint8Array;
    let expectedPassword: string | undefined;

    if (isUnencryptedScenario) {
      testBytes = originalBytes;
      expectedPassword = undefined;
    } else {
      testBytes = await encryptPDF(originalBytes, password);
      expectedPassword = password;
    }

    // Step 1: Verify pre-condition
    const preCheck = await isEncrypted(testBytes);
    if (!isUnencryptedScenario && !preCheck.encrypted) {
      console.error(`❌ Setup Error in test #${i}: File was not encrypted`);
      failed++;
      continue;
    }

    // Step 2: Run unlock function
    let unlockResult;
    try {
      unlockResult = await unlockPdf(testBytes, {
        customPassword: expectedPassword,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Test #${i} failed during unlock: ${msg}`);
      failed++;
      continue;
    }

    // Step 3: Verify post-condition 1: isEncrypted is false
    const postCheck = await isEncrypted(unlockResult.unlockedBytes);
    if (postCheck.encrypted) {
      console.error(`❌ Test #${i} failed: Output is still encrypted!`);
      failed++;
      continue;
    }

    // Step 4: Verify post-condition 2: Valid PDF header and trailer
    const header = new TextDecoder().decode(unlockResult.unlockedBytes.slice(0, 5));
    const tail = new TextDecoder().decode(unlockResult.unlockedBytes.slice(-100));

    if (header !== '%PDF-' || !tail.includes('%%EOF')) {
      console.error(`❌ Test #${i} failed: Invalid PDF header/trailer`);
      failed++;
      continue;
    }

    // Step 5: Verify post-condition 3: Can be parsed by PDFDocument and pages match
    try {
      const reloadedDoc = await PDFDocument.load(unlockResult.unlockedBytes);
      if (reloadedDoc.getPageCount() !== pageCount) {
        console.error(
          `❌ Test #${i} failed: Page count mismatch (expected ${pageCount}, got ${reloadedDoc.getPageCount()})`
        );
        failed++;
        continue;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Test #${i} failed: Could not parse unlocked PDF: ${msg}`);
      failed++;
      continue;
    }

    passed++;

    if (i % 20 === 0) {
      console.log(
        `Verified ${i}/100 unlock tests | Decryption verified, encryption removed, 100% valid PDF output.`
      );
    }
  }

  console.log('\n================================================================');
  console.log(`TOTAL UNLOCK TESTS: 100`);
  console.log(`PASSED (CLEANLY DECRYPTED & VERIFIED): ${passed} / 100`);
  console.log(`FAILED: ${failed} / 100`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 100 UNLOCK TESTS PASSED! PDF UNLOCK FUNCTION IS 100% OPERATIONAL.');
  }
}

run100UnlockTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
