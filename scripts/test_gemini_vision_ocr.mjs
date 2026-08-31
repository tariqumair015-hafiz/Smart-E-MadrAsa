import fs from 'fs';

// Load API key from env_config.json
const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const GEMINI_API_KEY = env.GEMINI_API_KEY;

/**
 * Detect active Gemini Vision model for generateContent
 */
async function detectVisionModel() {
  const candidates = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro-vision', 'gemini-1.5-pro'];
  for (const m of candidates) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}?key=${GEMINI_API_KEY}`);
      if (res.ok) {
        console.log(`✅ Detected active Gemini Vision Model: "${m}"`);
        return m;
      }
    } catch (e) {}
  }

  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      if (listData.models) {
        const visionModel = listData.models.find(mod => 
          mod.supportedGenerationMethods?.includes('generateContent') && 
          (mod.name.includes('flash') || mod.name.includes('vision') || mod.name.includes('2.'))
        );
        if (visionModel) {
          const nameClean = visionModel.name.replace('models/', '');
          console.log(`✅ Found Vision Model from API catalog: "${nameClean}"`);
          return nameClean;
        }
      }
    }
  } catch (e) {}

  return 'gemini-1.5-flash-latest';
}

/**
 * Test Gemini Vision API for Nasta'liq Urdu & Arabic Scanned Book Page OCR
 */
async function testGeminiVisionOcr() {
  console.log('==================================================');
  console.log('🚀 Testing Gemini Vision API for Urdu/Arabic Book OCR');
  console.log('==================================================\n');

  const activeModel = await detectVisionModel();

  // Sample scanned book page image URL from Archive.org
  const imageUrl = 'https://archive.org/services/img/DarsENizamiDarjaKhamsa5thYear';
  console.log(`\n📥 Downloading sample scanned page image: ${imageUrl}...`);

  const startTime = Date.now();

  try {
    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const buffer = await imgRes.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const downloadDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Image downloaded (${(buffer.byteLength / 1024).toFixed(1)} KB) in ${downloadDuration}s`);

    console.log(`\n🧠 Sending image to Gemini Vision API (${activeModel}) for Nasta'liq Urdu & Arabic OCR...`);
    const apiStartTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are an expert Islamic manuscript OCR digitizer. Extract all Urdu and Arabic text from this scanned book page image with 100% accuracy. Preserve Quranic ayaat, Ahadith text, headings, and Urdu explanations exactly as printed. Output ONLY the clean extracted page content."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }]
        })
      }
    );

    const apiDuration = ((Date.now() - apiStartTime) / 1000).toFixed(2);
    const data = await response.json();

    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log('\n==================================================');
    console.log('📊 GEMINI VISION OCR TEST RESULTS SUMMARY');
    console.log('==================================================');
    console.log(`🤖 Model Used: ${activeModel}`);
    console.log(`⏱️ OCR Processing Time per Page: ${apiDuration} seconds`);
    console.log('--------------------------------------------------');
    console.log('📄 Extracted Text Output (Urdu & Arabic):');
    console.log('--------------------------------------------------');
    console.log(extractedText ? extractedText.trim() : JSON.stringify(data, null, 2));
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ Gemini Vision OCR Exception:', err.message);
  }
}

testGeminiVisionOcr();
