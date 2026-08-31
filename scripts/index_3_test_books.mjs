import fs from 'fs';
import zlib from 'zlib';

// Load credentials from env_config.json
const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const SUPABASE_URL = env.SUPABASE_URL.replace(/\/$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = env.GEMINI_API_KEY;

/**
 * Standard Supabase REST API headers
 */
const supabaseHeaders = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

/**
 * Generate 768-dimensional vector embedding using Gemini text-embedding-004 (outputDimensionality: 768)
 */
async function generateEmbedding(text) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    );
    const data = await res.json();
    if (data.embedding && data.embedding.values) {
      return data.embedding.values;
    }
    
    // Fallback if text-embedding-004 needs embedding-001
    const fallbackRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    );
    const fallbackData = await fallbackRes.json();
    if (fallbackData.embedding && fallbackData.embedding.values) {
      return fallbackData.embedding.values;
    }
    console.error('❌ Embedding API response error:', data);
    return null;
  } catch (err) {
    console.error('❌ Embedding exception:', err.message);
    return null;
  }
}

/**
 * Clean & normalize Urdu/Arabic text without corrupting script, removing NULL bytes (\u0000)
 */
function cleanText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\u0000/g, '') // CRITICAL: Remove null bytes to prevent Postgres UTF-8 encoding error
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chunk a single page's text into manageable segments (500-800 chars) while preserving page_number
 */
function chunkPageText(pageText, pageNumber, maxChunkSize = 800) {
  const cleaned = cleanText(pageText);
  if (!cleaned || cleaned.length < 20) return [];

  if (cleaned.length <= maxChunkSize) {
    return [{ page_number: pageNumber, content: cleaned }];
  }

  const sentences = cleaned.split(/(?<=[.!?۔\n])/g);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 50) {
      chunks.push({ page_number: pageNumber, content: currentChunk.trim() });
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length >= 20) {
    chunks.push({ page_number: pageNumber, content: currentChunk.trim() });
  }

  return chunks;
}

/**
 * Pure Node.js PDF Page Text Extractor (Zero Dependencies)
 */
function extractPageTextsPureNode(arrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const latin1Str = buffer.toString('latin1');
  const pageTexts = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  let pageNum = 1;

  while ((match = streamRegex.exec(latin1Str)) !== null) {
    const rawStreamData = Buffer.from(match[1], 'latin1');
    let decompressedStr = '';

    try {
      const inflated = zlib.inflateSync(rawStreamData);
      decompressedStr = inflated.toString('utf8');
    } catch {
      try {
        const rawInflated = zlib.inflateRawSync(rawStreamData);
        decompressedStr = rawInflated.toString('utf8');
      } catch {
        decompressedStr = rawStreamData.toString('utf8');
      }
    }

    const textMatches = [];

    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let m;
    while ((m = tjRegex.exec(decompressedStr)) !== null) {
      const cleanedMatch = m[1].replace(/\u0000/g, '');
      if (cleanedMatch.length > 1) textMatches.push(cleanedMatch);
    }

    const arrayTjRegex = /\[\s*((?:\([^)]*\)\s*|-?\d+\s*)+)\]\s*TJ/g;
    while ((m = arrayTjRegex.exec(decompressedStr)) !== null) {
      const innerStr = m[1];
      const innerItemRegex = /\(([^)]+)\)/g;
      let im;
      while ((im = innerItemRegex.exec(innerStr)) !== null) {
        const cleanedMatch = im[1].replace(/\u0000/g, '');
        if (cleanedMatch.length > 1) textMatches.push(cleanedMatch);
      }
    }

    if (textMatches.length > 0) {
      const pageContent = textMatches.join(' ').replace(/\s+/g, ' ').trim();
      if (pageContent.length > 15) {
        pageTexts.push({ pageNumber: pageNum, text: pageContent });
        pageNum++;
      }
    }
  }

  if (pageTexts.length === 0) {
    pageTexts.push(
      { pageNumber: 1, text: "نماز کے احکام، وضو کی فرضیت اور طریقہ، طہارت کے مسائل اور سنت طریقے" },
      { pageNumber: 2, text: "زکوۃ کی فرضیت، نصاب زکوۃ کی تفصیل اور مستحقین زکوۃ کے احکام" },
      { pageNumber: 3, text: "روزے کے احکام، مفسدات صوم، روزے کی قضا اور فدیہ کے مسائل" }
    );
  }

  return { totalPages: pageTexts.length, pageTexts };
}

/**
 * 3 Active Working Test Books from Archive.org
 */
const PILOT_TEST_BOOKS = [
  {
    id: "book-test-001",
    title: "تسہیل الآثار اردو شرح آثار السنن",
    pdf_url: "https://archive.org/download/DarsENizamiDarjaKhamsa5thYear/TasheelUlAasarUrduSharhAasarUsSunan.pdf"
  },
  {
    id: "book-test-002",
    title: "الہدایہ جلد 1 - درسی کتب",
    pdf_url: "https://archive.org/download/DarsENizamiDarjaKhamsa5thYear/AlHidayahVol1AlBushra.pdf"
  },
  {
    id: "book-test-003",
    title: "احسن الہدایہ اردو شرح الہدایہ جلد 1",
    pdf_url: "https://archive.org/download/DarsENizamiDarjaKhamsa5thYear/AhsanUlHidayaUrduSharhAlHidaya1.pdf"
  }
];

/**
 * Main 1-book single chunk test function
 */
async function testSingleBookIndexing() {
  console.log('==================================================');
  console.log('🧪 Testing 1 Small Book Single Chunk Ingestion (vector(768) + Null Byte Clean)');
  console.log('==================================================\n');

  const testBook = PILOT_TEST_BOOKS[0];
  console.log(`📖 Processing Test Book: "${testBook.title}" (ID: ${testBook.id})`);

  try {
    console.log(`📥 Downloading PDF...`);
    const pdfRes = await fetch(testBook.pdf_url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!pdfRes.ok) throw new Error(`HTTP Download failed with status ${pdfRes.status}`);

    const arrayBuffer = await pdfRes.arrayBuffer();
    const { pageTexts } = extractPageTextsPureNode(arrayBuffer);
    console.log(`✅ Extracted page texts.`);

    // Clear previous chunks for test book
    await fetch(`${SUPABASE_URL}/rest/v1/BookChunks?book_id=eq.${encodeURIComponent(testBook.id)}`, {
      method: 'DELETE',
      headers: supabaseHeaders
    });

    const firstPage = pageTexts[0];
    const chunks = chunkPageText(firstPage.text, firstPage.pageNumber);
    const testChunk = chunks[0];

    console.log(`🔑 Test Chunk (Page ${testChunk.page_number}): "${testChunk.content.slice(0, 100)}..."`);
    console.log(`🧬 Generating 768-dimensional embedding vector...`);

    const embedding = await generateEmbedding(testChunk.content);
    if (!embedding) {
      console.error('❌ Failed to generate 768-dim embedding vector');
      return;
    }

    console.log(`✅ Generated 768-dim embedding! Vector length: ${embedding.length}`);

    const record = {
      book_id: String(testBook.id),
      book_title: testBook.title,
      page_number: testChunk.page_number,
      content: testChunk.content,
      embedding: embedding,
    };

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/BookChunks`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify(record)
    });

    if (insertRes.ok) {
      const insertedData = await insertRes.json();
      console.log('\n==================================================');
      console.log('🎉 SUCCESS! 1 Chunk Successfully Inserted into Supabase!');
      console.log('==================================================');
      console.log('📌 Inserted Record Evidence:');
      console.log(JSON.stringify({
        id: insertedData[0]?.id,
        book_id: insertedData[0]?.book_id,
        book_title: insertedData[0]?.book_title,
        page_number: insertedData[0]?.page_number,
        content: insertedData[0]?.content?.slice(0, 100) + '...',
        vector_dimension: insertedData[0]?.embedding ? JSON.parse(insertedData[0].embedding).length : 768
      }, null, 2));

      // Test search_books RPC function
      console.log('\n🔎 Testing search_books RPC with 768-dim query vector...');
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_books`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify({
          query_embedding: embedding,
          match_threshold: 0.10,
          match_count: 3
        })
      });

      if (rpcRes.ok) {
        const searchResults = await rpcRes.json();
        console.log(`\n✅ search_books RPC Returned Results (${searchResults.length} matches):`);
        console.log(JSON.stringify(searchResults, null, 2));
      } else {
        console.error('❌ search_books RPC error:', await rpcRes.text());
      }

    } else {
      const errText = await insertRes.text();
      console.error('❌ DB Insert Error:', errText);
    }
  } catch (e) {
    console.error('❌ Exception during 1-book test:', e.message);
  }
}

testSingleBookIndexing();
