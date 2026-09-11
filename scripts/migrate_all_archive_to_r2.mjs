import fs from 'fs';
import crypto from 'crypto';

const CONCURRENCY = 4; // 4 parallel workers (optimal speed without Archive.org HTTP 429 rate-limit)

// Load credentials from env_config.json
const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const SUPABASE_URL = (env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = env.CLOUDFLARE_BUCKET_NAME;
const PUBLIC_DOMAIN = env.CLOUDFLARE_PUBLIC_DOMAIN.replace(/\/$/, '');

const supabaseHeaders = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

function getR2Signature(method, path, bodyBuffer, contentType, dateStr, region = 'auto') {
  const service = 's3';
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const datestamp = dateStr.substring(0, 8);
  const payloadHash = crypto.createHash('sha256').update(bodyBuffer).digest('hex');
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credentialScope}\n` + crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const kDate = crypto.createHmac('sha256', `AWS4${SECRET_ACCESS_KEY}`).update(datestamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  return `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function uploadToR2(key, buffer, contentType = 'application/pdf') {
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${BUCKET_NAME}/${key}`;
  const url = `https://${host}${path}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const authorization = getR2Signature('PUT', path, buffer, contentType, dateStr);
  const payloadHash = crypto.createHash('sha256').update(buffer).digest('hex');

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Host': host,
        'x-amz-date': dateStr,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorization,
      },
      body: buffer,
      signal: AbortSignal.timeout(180000)
    });
    if (res.status === 200 || res.status === 204) {
      return `${PUBLIC_DOMAIN}/${key}`;
    } else {
      const txt = await res.text();
      console.error(` ❌ R2 PUT Error ${res.status}: ${txt.slice(0, 100)}`);
    }
  } catch (err) {
    console.error(` ❌ R2 Exception: ${err.message}`);
  }
  return null;
}

async function resolveArchiveUrl(targetUrl) {
  let cleanUrl = targetUrl.replace('http://', 'https://');
  if (!cleanUrl.includes('archive.org')) return cleanUrl;

  let itemID = null;
  if (cleanUrl.includes('/details/')) {
    itemID = cleanUrl.split('/details/')[1].split('/')[0].split('?')[0];
  } else if (cleanUrl.includes('/download/')) {
    const parts = cleanUrl.split('/download/')[1].split('/');
    if (parts.length > 0) itemID = parts[0].split('?')[0];
  }

  if (itemID) {
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${itemID}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(10000)
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta && Array.isArray(meta.files)) {
          const pdfFile = meta.files.find(f => f.name && f.name.toLowerCase().endsWith('.pdf') && !f.name.toLowerCase().includes('_text'));
          if (pdfFile) {
            return `https://archive.org/download/${itemID}/${encodeURIComponent(pdfFile.name)}`;
          }
        }
      }
    } catch (e) {}

    if (cleanUrl.includes('/details/')) {
      return `https://archive.org/download/${itemID}/${itemID}.pdf`;
    }
  }

  return cleanUrl;
}

async function downloadPdfWithRetry(url, retries = 3) {
  const resolvedUrl = await resolveArchiveUrl(url);
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(resolvedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(180000),
        redirect: 'follow'
      });
      if (res.status === 429 || res.status === 503) {
        console.warn(`   ⚠️ Archive.org HTTP ${res.status} Rate-Limited (Attempt ${attempt}/${retries}). Waiting...`);
        await new Promise(r => setTimeout(r, attempt * 3000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  throw new Error('Max retries exceeded');
}

async function updateSupabaseBook(bookId, patchData) {
  if (!SUPABASE_URL) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(bookId)}`, {
      method: 'PATCH',
      headers: supabaseHeaders,
      body: JSON.stringify(patchData),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) {}
}

async function startMigration() {
  console.log('==================================================');
  console.log(`⚡ HIGH-SUCCESS ARCHIVE TO R2 MIGRATOR (${CONCURRENCY} WORKERS)`);
  console.log('==================================================\n');

  const metadataPath = './books_metadata.json';
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ books_metadata.json not found!');
    return;
  }

  const books = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  const pendingQueue = [];
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const hasArchivePdf = b.pdf_url && b.pdf_url.includes('archive.org');
    const hasArchiveDesc = b.description && b.description.includes('archive.org');
    if (hasArchivePdf || hasArchiveDesc) {
      pendingQueue.push({ index: i, book: b });
    }
  }

  const totalToMigrate = pendingQueue.length;
  console.log(`📌 Found ${totalToMigrate} books with Archive.org links needing Cloudflare R2 upload.\n`);

  if (totalToMigrate === 0) {
    console.log('🎉 All books in metadata are already on Cloudflare R2!');
    return;
  }

  let completed = 0;
  let successCount = 0;
  let saveCounter = 0;

  async function worker(workerId) {
    while (pendingQueue.length > 0) {
      const item = pendingQueue.shift();
      if (!item) break;

      const { index, book } = item;
      let modified = false;
      let updatedPdfUrl = book.pdf_url;
      let updatedDescription = book.description;
      let lastErrMsg = '';

      // 1. Root PDF
      if (book.pdf_url && book.pdf_url.includes('archive.org')) {
        try {
          const buffer = await downloadPdfWithRetry(book.pdf_url);
          const mbSize = (buffer.length / (1024 * 1024)).toFixed(1);
          const key = `pdfs/book_${book.id}.pdf`;
          const r2Url = await uploadToR2(key, buffer, 'application/pdf');
          if (r2Url) {
            updatedPdfUrl = r2Url;
            modified = true;
          }
        } catch (e) {
          lastErrMsg = e.message;
        }
      }

      // 2. Multi-volume description
      if (book.description && book.description.includes('archive.org')) {
        try {
          let parsed = JSON.parse(book.description);
          if (Array.isArray(parsed)) {
            for (let vIdx = 0; vIdx < parsed.length; vIdx++) {
              const vItem = parsed[vIdx];
              const vUrl = typeof vItem === 'string' ? vItem : vItem.url;
              if (vUrl && vUrl.includes('archive.org')) {
                try {
                  const buf = await downloadPdfWithRetry(vUrl);
                  const key = `pdfs/book_${book.id}_v${vIdx}.pdf`;
                  const r2Url = await uploadToR2(key, buf, 'application/pdf');
                  if (r2Url) {
                    if (typeof vItem === 'string') parsed[vIdx] = r2Url;
                    else parsed[vIdx].url = r2Url;
                    modified = true;
                  }
                } catch (ve) {
                  lastErrMsg = ve.message;
                }
              }
            }
            if (modified) updatedDescription = JSON.stringify(parsed);
          }
        } catch (de) {}
      }

      completed++;

      if (modified) {
        successCount++;
        books[index].pdf_url = updatedPdfUrl;
        books[index].description = updatedDescription;

        saveCounter++;
        if (saveCounter % 3 === 0 || pendingQueue.length === 0) {
          fs.writeFileSync('./books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
          if (fs.existsSync('./public/books_metadata.json')) {
            fs.writeFileSync('./public/books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
          }
        }

        updateSupabaseBook(book.id, { pdf_url: updatedPdfUrl, description: updatedDescription });

        console.log(`⚡ [Worker ${workerId}] (${completed}/${totalToMigrate}) Transferred Book #${book.id}: "${book.title?.slice(0, 25)}"`);
      } else {
        console.warn(`❌ [Worker ${workerId}] (${completed}/${totalToMigrate}) Failed Book #${book.id}: ${lastErrMsg || 'File not found or unreachable'}`);
      }

      // Small delay between downloads to prevent Archive.org IP block
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // Start parallel workers
  console.log(`🚀 Launching ${CONCURRENCY} smart workers with Archive.org API resolution...\n`);
  const workers = [];
  for (let w = 1; w <= CONCURRENCY; w++) {
    workers.push(worker(w));
  }

  await Promise.all(workers);

  // Final save
  fs.writeFileSync('./books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  if (fs.existsSync('./public/books_metadata.json')) {
    fs.writeFileSync('./public/books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  }

  console.log('\n==================================================');
  console.log(`🎉 HIGH-SUCCESS MIGRATION COMPLETE! Total Books Transferred: ${successCount}`);
  console.log('==================================================\n');
}

startMigration();
