import fs from 'fs';
import crypto from 'crypto';

// Load credentials from env_config.json
const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const SUPABASE_URL = env.SUPABASE_URL.replace(/\/$/, '');
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
  'Prefer': 'return=representation',
};

/**
 * AWS SigV4 signed authorization header
 */
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

/**
 * Fast Upload Buffer to Cloudflare R2
 */
async function uploadToR2(key, buffer, contentType = 'image/jpeg') {
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
      signal: AbortSignal.timeout(30000)
    });
    
    if (res.status === 200 || res.status === 204) {
      return `${PUBLIC_DOMAIN}/${key}`;
    }
  } catch (err) {}
  return null;
}

const processedCovers = new Set();
const processedPdfs = new Set();

/**
 * Process single cover item
 */
async function processCover(book) {
  processedCovers.add(book.id);
  if (!book.cover_url) return false;
  try {
    const imgRes = await fetch(book.cover_url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!imgRes.ok) return false;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const key = `covers/${book.id}.jpg`;
    const r2Url = await uploadToR2(key, buffer, 'image/jpeg');

    if (r2Url) {
      await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(book.id)}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ cover_url: r2Url })
      });
      console.log(` ✅ Cover [${book.id}]: ${r2Url}`);
      return true;
    }
  } catch (e) {
    console.log(` ⏩ Fast Skip Cover [${book.id}]`);
  }
  return false;
}

/**
 * Process single PDF item
 */
async function processPdf(book) {
  processedPdfs.add(book.id);
  if (!book.pdf_url) return false;
  try {
    const pdfRes = await fetch(book.pdf_url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000)
    });
    if (!pdfRes.ok) return false;

    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    const key = `pdfs/${book.id}.pdf`;
    const r2Url = await uploadToR2(key, buffer, 'application/pdf');

    if (r2Url) {
      await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(book.id)}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ pdf_url: r2Url })
      });
      console.log(` ⚡ PDF [${book.id}]: ${r2Url}`);
      return true;
    }
  } catch (e) {
    console.log(` ⏩ Fast Skip PDF [${book.id}]`);
  }
  return false;
}

/**
 * High-Speed Parallel Resume Migration Loop with Memory Set Deduplication
 */
async function fastCloudflareSync() {
  console.log('==================================================');
  console.log('⚡ Starting HIGH-SPEED Parallel Cloudflare R2 Sync (Deduplicated)');
  console.log('==================================================\n');

  let totalCoversUploaded = 0;
  let totalPdfsUploaded = 0;

  // Pre-fetch all non-r2.dev books from Supabase once
  let allBooks = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Books?select=id,title,cover_url,pdf_url&offset=${offset}&limit=${pageSize}`, {
      headers: supabaseHeaders
    });
    if (!res.ok) break;
    const chunk = await res.json();
    if (!chunk || chunk.length === 0) break;
    allBooks.push(...chunk);
    offset += pageSize;
  }

  console.log(`Total books catalog fetched: ${allBooks.length}`);

  const coversToProcess = allBooks.filter(b => b.cover_url && !b.cover_url.includes(PUBLIC_DOMAIN));
  const pdfsToProcess = allBooks.filter(b => b.pdf_url && !b.pdf_url.includes(PUBLIC_DOMAIN));

  console.log(`🖼️ Pending Covers to migrate: ${coversToProcess.length}`);
  console.log(`📄 Pending PDFs to migrate: ${pdfsToProcess.length}\n`);

  // Parallel Batching for Covers
  const coverBatchSize = 10;
  for (let i = 0; i < coversToProcess.length; i += coverBatchSize) {
    const batch = coversToProcess.slice(i, i + coverBatchSize);
    console.log(`🚀 Covers Batch ${Math.floor(i / coverBatchSize) + 1} / ${Math.ceil(coversToProcess.length / coverBatchSize)}...`);
    const results = await Promise.all(batch.map(processCover));
    totalCoversUploaded += results.filter(Boolean).length;
  }

  // Parallel Batching for PDFs
  const pdfBatchSize = 5;
  for (let i = 0; i < pdfsToProcess.length; i += pdfBatchSize) {
    const batch = pdfsToProcess.slice(i, i + pdfBatchSize);
    console.log(`🚀 PDFs Batch ${Math.floor(i / pdfBatchSize) + 1} / ${Math.ceil(pdfsToProcess.length / pdfBatchSize)}...`);
    const results = await Promise.all(batch.map(processPdf));
    totalPdfsUploaded += results.filter(Boolean).length;
  }

  console.log('\n==================================================');
  console.log(`🎉 HIGH-SPEED SYNC COMPLETE! Total: ${totalCoversUploaded} Covers, ${totalPdfsUploaded} PDFs`);
  console.log('==================================================\n');
}

fastCloudflareSync();
