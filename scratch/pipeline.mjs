import fs from 'fs';
import path from 'path';

// Retrieve environment variables loaded via node --env-file=.env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error('Error: Please provide SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY in your .env file.');
  console.log('Run the script using: node --env-file=.env scratch/pipeline.mjs');
  process.exit(1);
}

// Configuration
const CHUNK_SIZE = 700; // character limit per chunk
const CHUNK_OVERLAP = 150; // overlap character size
const BATCH_EMBED_LIMIT = 10; // 10 chunks per batch = 10 requests. Free tier: 100 RPM, so 10 batches/min max
const CONCURRENCY_DELAY = 1000; // delay between books in ms

// Helper to sleep/delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse Archive.org URL to get identifier and base filename
function parseArchiveUrl(pdfUrl) {
  if (!pdfUrl) return null;
  // Match: archive.org/download/{identifier}/{filename}.pdf
  const match = pdfUrl.match(/archive\.org\/download\/([^\/]+)\/([^\/#\?]+)\.pdf/i);
  if (!match) return null;
  return {
    identifier: match[1],
    filename: match[2]
  };
}

// Fetch books from Supabase REST API
async function fetchBooks() {
  // We use pagination since Supabase REST API limits returns to 1000 rows by default
  let allBooks = [];
  let page = 0;
  const limit = 1000;
  
  while (true) {
    const offset = page * limit;
    const url = `${SUPABASE_URL}/rest/v1/Books?select=id,title,pdf_url&order=id.asc&limit=${limit}&offset=${offset}`;
    
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch books: ${res.status} ${await res.text()}`);
    }
    
    const books = await res.json();
    if (books.length === 0) break;
    
    allBooks = allBooks.concat(books);
    page++;
    
    if (books.length < limit) break;
  }
  
  return allBooks;
}

// Check if a book's chunks already exist in the database (resumability check)
async function isBookProcessed(bookId) {
  const url = `${SUPABASE_URL}/rest/v1/book_chunks?select=id&book_id=eq.${bookId}&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to check if book is processed: ${res.status}`);
  }
  
  const data = await res.json();
  return data.length > 0;
}

// Download DjVu text from Archive.org
async function downloadDjvuText(identifier, filename) {
  const url = `https://archive.org/download/${identifier}/${filename}_djvu.txt`;
  console.log(`[Archive] Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Archive.org returned status ${res.status}`);
  }
  return await res.text();
}

// Helper to chunk text
function chunkText(text, size, overlap) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + size;
    chunks.push(text.slice(start, end));
    start += (size - overlap);
  }
  return chunks;
}

// Get embeddings for a list of text chunks using Gemini API (batch call) — with auto-retry on 429
async function getEmbeddingsBatch(texts, retryCount = 0) {
  const MAX_RETRIES = 5;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${GEMINI_API_KEY}`;
  
  const requests = texts.map(text => ({
    model: 'models/gemini-embedding-2',
    content: { parts: [{ text }] },
    outputDimensionality: 768
  }));
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests })
  });
  
  // Handle rate limit (429) with auto-retry
  if (res.status === 429) {
    if (retryCount >= MAX_RETRIES) {
      throw new Error(`Gemini API rate limit exceeded after ${MAX_RETRIES} retries.`);
    }
    let waitMs = 65000; // default 65 seconds
    try {
      const errData = await res.json();
      const retryDelay = errData?.error?.details?.find(d => d.retryDelay)?.retryDelay;
      if (retryDelay) {
        const seconds = parseInt(retryDelay.replace('s', ''), 10);
        if (!isNaN(seconds)) waitMs = (seconds + 5) * 1000; // add 5s buffer
      }
    } catch {}
    console.log(`[RateLimit] Quota hit. Waiting ${Math.round(waitMs / 1000)}s before retry (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    await sleep(waitMs);
    // After 3 retries, add a 2-minute hard cooldown to let quota fully reset
    if (retryCount >= 2) {
      console.log(`[RateLimit] Adding 2-min hard cooldown to let quota reset...`);
      await sleep(120000);
    }
    return getEmbeddingsBatch(texts, retryCount + 1);
  }
  
  if (!res.ok) {
    throw new Error(`Gemini Embeddings API returned status ${res.status}: ${await res.text()}`);
  }
  
  const result = await res.json();
  return result.embeddings.map(e => e.values);
}

// Upload chunks to Supabase in bulk
async function uploadChunks(chunks) {
  const url = `${SUPABASE_URL}/rest/v1/book_chunks`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(chunks)
  });
  
  if (!res.ok) {
    throw new Error(`Failed to upload chunks to Supabase: ${res.status} ${await res.text()}`);
  }
}

// Process a single book
async function processBook(book) {
  const archiveInfo = parseArchiveUrl(book.pdf_url);
  if (!archiveInfo) {
    console.log(`[Skip] Book ID ${book.id} does not have a valid Archive.org URL.`);
    return false;
  }
  
  const { identifier, filename } = archiveInfo;
  
  console.log(`\n========================================`);
  console.log(`[Start] Processing Book ID: ${book.id} | Title: ${book.title}`);
  
  // 1. Check if already processed
  const processed = await isBookProcessed(book.id);
  if (processed) {
    console.log(`[Skip] Book ID ${book.id} already processed previously.`);
    return true;
  }
  
  // 2. Download text
  let rawText;
  try {
    rawText = await downloadDjvuText(identifier, filename);
  } catch (err) {
    console.error(`[Error] Failed to download text for ${filename}:`, err.message);
    return false;
  }
  
  // 3. Parse by page (split by Form Feed '\f')
  const rawPages = rawText.split('\f');
  console.log(`[Parse] Found ${rawPages.length} pages in the DjVu text file.`);
  
  // 4. Create chunks with metadata
  const allChunks = [];
  rawPages.forEach((pageContent, index) => {
    const pageNumber = index + 1; // 1-based page index
    const cleanContent = pageContent.replace(/\s+/g, ' ').trim();
    if (!cleanContent || cleanContent.length < 15) return; // skip empty or extremely short pages
    
    // Chunk this page
    const pageChunks = chunkText(cleanContent, CHUNK_SIZE, CHUNK_OVERLAP);
    pageChunks.forEach(chunkTextContent => {
      allChunks.push({
        book_id: book.id,
        page_number: pageNumber,
        content: chunkTextContent
      });
    });
  });
  
  console.log(`[Chunk] Generated ${allChunks.length} chunks for embedding.`);
  if (allChunks.length === 0) {
    console.log(`[Done] No content chunks to process.`);
    return true;
  }
  
  // 5. Generate embeddings and upload in batches
  console.log(`[Embed] Generating embeddings using Gemini API (batch size: ${BATCH_EMBED_LIMIT})...`);
  
  for (let i = 0; i < allChunks.length; i += BATCH_EMBED_LIMIT) {
    const batch = allChunks.slice(i, i + BATCH_EMBED_LIMIT);
    const texts = batch.map(c => c.content);
    
    try {
      const embeddings = await getEmbeddingsBatch(texts);
      
      // Combine chunk meta with embedding values
      const chunksWithEmbeddings = batch.map((c, index) => ({
        ...c,
        embedding: embeddings[index]
      }));
      
      // Upload to Supabase
      await uploadChunks(chunksWithEmbeddings);
      console.log(`[Progress] Uploaded chunks ${i + 1} to ${Math.min(i + BATCH_EMBED_LIMIT, allChunks.length)} / ${allChunks.length}`);
      
      // Sleep between batches: 10 chunks = 10 requests. Wait 7s → max ~85 req/min (safe under 100 RPM)
      await sleep(7000);
    } catch (err) {
      console.warn(`[Skip] Batch at index ${i} failed, skipping: ${err.message.substring(0, 80)}`);
      // Don't fail the whole book — just skip this batch and wait before next one
      await sleep(30000); // wait 30s after a failed batch before continuing
    }
  }
  
  console.log(`[Success] Finished processing Book ID: ${book.id}`);
  return true; // Always return true so pipeline continues to next book
}

// Main Runner
async function main() {
  // Option to test on a single book or run on all
  const LIMIT_BOOKS = process.argv.includes('--test') ? 1 : null;
  
  console.log('--- Starting Book Processing Pipeline ---');
  console.log(`Fetching books list from Supabase...`);
  
  let books;
  try {
    books = await fetchBooks();
    console.log(`Found total ${books.length} books in your database.`);
  } catch (err) {
    console.error('Failed to boot pipeline:', err.message);
    process.exit(1);
  }
  
  const booksToProcess = LIMIT_BOOKS ? books.slice(0, LIMIT_BOOKS) : books;
  if (LIMIT_BOOKS) {
    console.log(`\n*** DRY RUN / TEST MODE ENABLED ***`);
    console.log(`Only processing the first ${LIMIT_BOOKS} book(s) for testing.`);
  }
  
  let successCount = 0;
  let failCount = 0;
  
  for (const book of booksToProcess) {
    try {
      const ok = await processBook(book);
      if (ok) successCount++;
      else failCount++;
    } catch (err) {
      console.error(`Unexpected failure on book ${book.id}:`, err.message);
      failCount++;
    }
    await sleep(CONCURRENCY_DELAY); // delay to avoid rate limit spikes
  }
  
  console.log(`\n========================================`);
  console.log(`Pipeline run finished.`);
  console.log(`Successfully processed: ${successCount} book(s)`);
  console.log(`Failed/Skipped: ${failCount} book(s)`);
}

main();
