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
 * Generate AWS SigV4 signed authorization header for Cloudflare R2 S3 PUT API
 */
function getR2Signature(method, path, bodyBuffer, contentType, dateStr, region = 'auto') {
  const service = 's3';
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const datestamp = dateStr.substring(0, 8); // YYYYMMDD
  
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
 * Upload Buffer to Cloudflare R2
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
      signal: AbortSignal.timeout(60000) // 60s timeout for R2 upload
    });
    
    if (res.status === 200 || res.status === 204) {
      return `${PUBLIC_DOMAIN}/${key}`;
    } else {
      const errTxt = await res.text();
      console.error(`❌ R2 Upload status ${res.status}: ${errTxt.slice(0, 100)}`);
    }
  } catch (err) {
    console.error(`❌ R2 Upload exception for ${key}:`, err.message);
  }
  return null;
}

/**
 * Continuous Master Sync Loop
 */
async function masterSyncToCloudflare() {
  console.log('==================================================');
  console.log('🚀 Starting Continuous Cloudflare R2 Migration Loop');
  console.log('==================================================\n');

  let totalCoversUploaded = 0;
  let totalPdfsUploaded = 0;

  while (true) {
    // 1. Fetch pending Covers (where cover_url does not contain r2.dev)
    const coversRes = await fetch(`${SUPABASE_URL}/rest/v1/Books?select=id,title,cover_url&cover_url=not.is.null&cover_url=not.ilike.*r2.dev*&limit=50`, {
      headers: supabaseHeaders
    });
    const pendingCovers = coversRes.ok ? await coversRes.json() : [];

    // 2. Fetch pending PDFs (where pdf_url does not contain r2.dev)
    const pdfsRes = await fetch(`${SUPABASE_URL}/rest/v1/Books?select=id,title,pdf_url&pdf_url=not.is.null&pdf_url=not.ilike.*r2.dev*&limit=20`, {
      headers: supabaseHeaders
    });
    const pendingPdfs = pdfsRes.ok ? await pdfsRes.json() : [];

    console.log(`\n📌 Current Queue Status: ${pendingCovers.length} Covers pending | ${pendingPdfs.length} PDFs pending in batch`);

    if (pendingCovers.length === 0 && pendingPdfs.length === 0) {
      console.log('\n🎉 ALL COVERS AND PDFS HAVE BEEN SUCCESSFULLY MIGRATED TO CLOUDFLARE R2!');
      break;
    }

    // Process Covers
    for (const book of pendingCovers) {
      if (!book.cover_url) continue;
      try {
        console.log(`🖼️ Downloading cover [${book.id}] "${book.title.slice(0, 35)}"...`);
        const imgRes = await fetch(book.cover_url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(15000) // 15s timeout for cover download
        });

        if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const key = `covers/${book.id}.jpg`;

        const r2Url = await uploadToR2(key, buffer, 'image/jpeg');
        if (r2Url) {
          await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(book.id)}`, {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify({ cover_url: r2Url })
          });
          totalCoversUploaded++;
          console.log(`   ✅ [Cover #${totalCoversUploaded}] Synced: ${r2Url}`);
        }
      } catch (e) {
        console.warn(`   ⚠️ Skipped cover [${book.id}]: ${e.message}`);
      }
    }

    // Process PDFs
    for (const book of pendingPdfs) {
      if (!book.pdf_url) continue;
      try {
        console.log(`📄 Downloading PDF [${book.id}] "${book.title.slice(0, 35)}"...`);
        const pdfRes = await fetch(book.pdf_url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(45000) // 45s timeout for PDF download
        });

        if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);

        const buffer = Buffer.from(await pdfRes.arrayBuffer());
        const key = `pdfs/${book.id}.pdf`;

        const r2Url = await uploadToR2(key, buffer, 'application/pdf');
        if (r2Url) {
          await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(book.id)}`, {
            method: 'PATCH',
            headers: supabaseHeaders,
            body: JSON.stringify({ pdf_url: r2Url })
          });
          totalPdfsUploaded++;
          console.log(`   ✅ [PDF #${totalPdfsUploaded}] Synced: ${r2Url}`);
        }
      } catch (e) {
        console.warn(`   ⚠️ Skipped PDF [${book.id}]: ${e.message}`);
      }
    }
  }

  console.log('==================================================');
  console.log(`🎉 MIGRATION COMPLETE! Total Synced to R2: ${totalCoversUploaded} Covers, ${totalPdfsUploaded} PDFs`);
  console.log('==================================================\n');
}

masterSyncToCloudflare();
