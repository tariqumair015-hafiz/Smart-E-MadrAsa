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
      signal: AbortSignal.timeout(180000) // 3 mins timeout for R2 upload
    });
    
    if (res.status === 200 || res.status === 204) {
      return `${PUBLIC_DOMAIN}/${key}`;
    } else {
      const errTxt = await res.text();
      console.error(` ❌ R2 PUT Error ${res.status}: ${errTxt.slice(0, 100)}`);
    }
  } catch (err) {
    console.error(` ❌ R2 Upload Exception: ${err.message}`);
  }
  return null;
}

/**
 * Process single PDF item with proper download timeout (120 seconds)
 */
async function processPdf(book, index, total) {
  if (!book.pdf_url) return false;
  const shortTitle = book.title ? book.title.slice(0, 30) : book.id;
  
  try {
    console.log(`\n📥 [${index}/${total}] Downloading PDF: "${shortTitle}"...`);
    const pdfRes = await fetch(book.pdf_url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(120000), // 120s (2 minutes) to allow full PDF download
      redirect: 'follow'
    });

    if (!pdfRes.ok) {
      console.log(` ⏩ HTTP ${pdfRes.status} Error for [${book.id}]`);
      return false;
    }

    const buffer = Buffer.from(await pdfRes.arrayBuffer());
    const mbSize = (buffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(` 📦 Downloaded ${mbSize} MB. Uploading to Cloudflare R2...`);

    const key = `pdfs/${book.id}.pdf`;
    const r2Url = await uploadToR2(key, buffer, 'application/pdf');

    if (r2Url) {
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(book.id)}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify({ pdf_url: r2Url })
      });
      if (patchRes.ok) {
        console.log(` ⚡ [SUCCESS PDF ${index}] Synced to Cloudflare: ${r2Url}`);
        return true;
      }
    }
  } catch (e) {
    console.log(` ⏩ Skip PDF [${book.id}]: ${e.message}`);
  }
  return false;
}

/**
 * Dedicated PDF Migration Loop
 */
async function fastPdfCloudflareSync() {
  console.log('==================================================');
  console.log('📄 Starting Dedicated PDF Migration to Cloudflare R2');
  console.log('==================================================\n');

  // Fetch all books where pdf_url is not null and not already on r2.dev
  let unmigratedPdfs = [];
  let offset = 0;
  const pageSize = 1000;
  
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Books?select=id,title,pdf_url&pdf_url=not.is.null&pdf_url=not.ilike.*r2.dev*&offset=${offset}&limit=${pageSize}`, {
      headers: supabaseHeaders
    });
    if (!res.ok) break;
    const chunk = await res.json();
    if (!chunk || chunk.length === 0) break;
    unmigratedPdfs.push(...chunk);
    offset += pageSize;
  }

  console.log(`📌 Found ${unmigratedPdfs.length} Unmigrated PDFs needing Cloudflare R2 upload.\n`);

  let successPdfsCount = 0;
  const batchSize = 3; // Process 3 PDFs in parallel to balance bandwidth

  for (let i = 0; i < unmigratedPdfs.length; i += batchSize) {
    const batch = unmigratedPdfs.slice(i, i + batchSize);
    console.log(`🚀 Processing PDF Batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(unmigratedPdfs.length / batchSize)}...`);
    
    const results = await Promise.all(
      batch.map((b, idx) => processPdf(b, i + idx + 1, unmigratedPdfs.length))
    );

    successPdfsCount += results.filter(Boolean).length;
  }

  console.log('\n==================================================');
  console.log(`🎉 PDF MIGRATION COMPLETE! Total PDFs Uploaded to R2: ${successPdfsCount}`);
  console.log('==================================================\n');
}

fastPdfCloudflareSync();
