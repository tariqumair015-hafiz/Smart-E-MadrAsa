import createWorker from 'tesseract.js/src/createWorker.js';
import path from 'path';

/**
 * Benchmark Tesseract.js OCR on Urdu text image / scanned book page
 */
async function runUrduOcrTest() {
  console.log('==================================================');
  console.log('🧪 Starting Tesseract.js Urdu OCR Performance & Accuracy Test');
  console.log('==================================================\n');

  const startTime = Date.now();
  console.log('⏳ Initializing Tesseract.js Worker with Urdu traineddata...');

  try {
    // Initialize Tesseract worker pointing to local urd.traineddata in root directory
    const worker = await createWorker('urd', 1, {
      langPath: path.resolve('.'),
      cachePath: path.resolve('.'),
    });

    const initDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Worker initialized in ${initDuration} seconds.`);

    // Test sample scanned page image URL
    const samplePageUrl = 'https://archive.org/services/img/DarsENizamiDarjaKhamsa5thYear';

    console.log(`\n📥 Fetching sample scanned page for OCR test...`);
    console.log(`URL: ${samplePageUrl}`);

    const pageStartTime = Date.now();

    const { data: { text, confidence } } = await worker.recognize(samplePageUrl);
    const pageDuration = ((Date.now() - pageStartTime) / 1000).toFixed(2);

    console.log('\n==================================================');
    console.log('📊 OCR TEST RESULTS SUMMARY');
    console.log('==================================================');
    console.log(`⏱️ Processing Time per Page: ${pageDuration} seconds`);
    console.log(`🎯 Average Recognition Confidence: ${confidence}%`);
    console.log('--------------------------------------------------');
    console.log('📄 Extracted Urdu Text Output:');
    console.log('--------------------------------------------------');
    console.log(text ? text.trim() : '(No text extracted)');
    console.log('==================================================\n');

    await worker.terminate();

  } catch (err) {
    console.error('❌ OCR Recognition Error:', err.message);
  }
}

runUrduOcrTest();
