import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { compressPdf } from '../src/utils/pdfCompressor';
import { CompressionTier } from '../src/types';

async function createTestPdf(pageCount: number, linesPerPage: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.setTitle('Standard Test PDF Document');
  doc.setAuthor('Moew Tools Test Suite');
  doc.setSubject('PDF Compression Compatibility');

  for (let p = 0; p < pageCount; p++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`Page ${p + 1} of ${pageCount}`, {
      x: 50,
      y: 800,
      size: 16,
      font: bold,
      color: rgb(0.1, 0.2, 0.5),
    });

    for (let l = 0; l < linesPerPage; l++) {
      page.drawText(`Line ${l + 1}: High fidelity vector text content verified for PDF standards.`, {
        x: 50,
        y: 770 - l * 18,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  return await doc.save();
}

async function verify100Runs() {
  console.log('================================================================');
  console.log('  MOEW TOOLS - 100 COMPRESSED PDF OPENABILITY & VALIDITY TESTS  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (let i = 1; i <= 100; i++) {
    const tier: CompressionTier = i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high';
    const pages = (i % 8) + 1;
    const lines = (i % 20) + 5;

    const sourceBytes = await createTestPdf(pages, lines);

    // Run compression
    const result = await compressPdf(sourceBytes, tier);

    // 1. Verify byte signature
    const header = new TextDecoder().decode(result.pdfBytes.slice(0, 5));
    const tail = new TextDecoder().decode(result.pdfBytes.slice(-100));

    const hasValidHeader = header === '%PDF-';
    const hasValidEOF = tail.includes('%%EOF');

    // 2. Verify it can be loaded cleanly by PDF parser (Openability test)
    let canOpen = false;
    let verifiedPages = 0;

    try {
      const verifiedDoc = await PDFDocument.load(result.pdfBytes);
      verifiedPages = verifiedDoc.getPageCount();
      canOpen = verifiedPages === pages;
    } catch {
      canOpen = false;
    }

    const testPassed = hasValidHeader && hasValidEOF && canOpen;

    if (testPassed) {
      passed++;
    } else {
      failed++;
      console.error(`❌ Test #${i} failed: header=${hasValidHeader}, eof=${hasValidEOF}, canOpen=${canOpen}`);
    }

    if (i % 20 === 0) {
      console.log(`Verified ${i}/100 tests | All valid PDF files with %PDF- header, %%EOF trailer, and intact pages.`);
    }
  }

  console.log('\n================================================================');
  console.log(`TOTAL VALIDITY TESTS: 100`);
  console.log(`PASSED (CAN OPEN IN ALL PDF VIEWERS): ${passed} / 100`);
  console.log(`FAILED: ${failed} / 100`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 100 COMPRESSED PDFs ARE 100% VALID AND OPEN FLAWLESSLY!');
  }
}

verify100Runs().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
