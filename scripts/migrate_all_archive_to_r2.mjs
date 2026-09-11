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
    }
  } catch (err) {
    console.error(` ❌ R2 Upload error (${key}): ${err.message}`);
  }
  return null;
}

async function downloadPdf(url) {
  let cleanUrl = url.replace('http://', 'https://');
  if (cleanUrl.includes('archive.org')) {
    if (cleanUrl.includes('/details/')) {
      const itemID = cleanUrl.split('/details/')[1].split('/')[0].split('?')[0];
      cleanUrl = `https://archive.org/download/${itemID}/${itemID}.pdf`;
    }
  }
  const res = await fetch(cleanUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(180000),
    redirect: 'follow'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function startMigration() {
  console.log('==================================================');
  console.log('🚀 Transferring Archive.org PDFs to Cloudflare R2');
  console.log('==================================================\n');

  // Fetch pending books from Supabase
  let pendingBooks = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Books?select=id,title,pdf_url,description&or=(pdf_url.ilike.*archive.org*,description.ilike.*archive.org*)&offset=${offset}&limit=${pageSize}`, {
      headers: supabaseHeaders
    });
    if (!res.ok) break;
    const chunk = await res.json();
    if (!chunk || chunk.length === 0) break;
    pendingBooks.push(...chunk);
    offset += pageSize;
  }

  console.log(`📌 Found ${pendingBooks.length} books with Archive.org links needing migration to R2.\n`);

  if (pendingBooks.length === 0) {
    console.log('🎉 All books are already on Cloudflare R2!');
    return;
  }

  let migratedCount = 0;

  for (let i = 0; i < pendingBooks.length; i++) {
    const book = pendingBooks[i];
    console.log(`\n[${i + 1}/${pendingBooks.length}] Processing Book #${book.id}: "${book.title?.slice(0, 35)}"...`);

    let modified = false;
    let updatedPdfUrl = book.pdf_url;
    let updatedDescription = book.description;

    // 1. Root pdf_url
    if (book.pdf_url && book.pdf_url.includes('archive.org')) {
      try {
        const buffer = await downloadPdf(book.pdf_url);
        const mbSize = (buffer.length / (1024 * 1024)).toFixed(2);
        console.log(` 📦 Downloaded ${mbSize} MB. Uploading to R2...`);
        const key = `pdfs/book_${book.id}.pdf`;
        const r2Url = await uploadToR2(key, buffer, 'application/pdf');
        if (r2Url) {
          updatedPdfUrl = r2Url;
          modified = true;
          console.log(` ⚡ [SUCCESS] Synced main PDF: ${r2Url}`);
        }
      } catch (e) {
        console.warn(` ⚠️ Skip main PDF for Book #${book.id}: ${e.message}`);
      }
    }

    // 2. Volumes inside description
    if (book.description && book.description.includes('archive.org')) {
      try {
        let parsed = JSON.parse(book.description);
        if (Array.isArray(parsed)) {
          for (let vIdx = 0; vIdx < parsed.length; vIdx++) {
            const item = parsed[vIdx];
            const itemUrl = typeof item === 'string' ? item : item.url;
            if (itemUrl && itemUrl.includes('archive.org')) {
              try {
                console.log(` 📥 Volume ${vIdx + 1}/${parsed.length}: Downloading...`);
                const buf = await downloadPdf(itemUrl);
                const mbSize = (buf.length / (1024 * 1024)).toFixed(2);
                console.log(`   📦 Downloaded ${mbSize} MB. Uploading to R2...`);
                const key = `pdfs/book_${book.id}_v${vIdx}.pdf`;
                const r2Url = await uploadToR2(key, buf, 'application/pdf');
                if (r2Url) {
                  if (typeof item === 'string') parsed[vIdx] = r2Url;
                  else parsed[vIdx].url = r2Url;
                  modified = true;
                  console.log(`   ⚡ [SUCCESS] Vol ${vIdx + 1} Synced: ${r2Url}`);
                }
              } catch (ve) {
                console.warn(`   ⚠️ Skip Vol ${vIdx + 1}: ${ve.message}`);
              }
            }
          }
          if (modified) {
            updatedDescription = JSON.stringify(parsed);
          }
        }
      } catch (de) {
        // Not JSON
      }
    }

    // Save to Supabase
    if (modified) {
      const patchData = {};
      if (updatedPdfUrl !== book.pdf_url) patchData.pdf_url = updatedPdfUrl;
      if (updatedDescription !== book.description) patchData.description = updatedDescription;

      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/Books?id=eq.${encodeURIComponent(book.id)}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify(patchData)
      });

      if (patchRes.ok) {
        migratedCount++;
        console.log(` ✅ Updated Book #${book.id} in Supabase!`);
      }
    }
  }

  // Update local books_metadata.json
  console.log('\n🔄 Updating local books_metadata.json...');
  try {
    const metaRes = await fetch(`${SUPABASE_URL}/rest/v1/Books?select=*`, { headers: supabaseHeaders });
    if (metaRes.ok) {
      const allBooks = await metaRes.json();
      fs.writeFileSync('./books_metadata.json', JSON.stringify(allBooks, null, 2), 'utf8');
      fs.writeFileSync('./public/books_metadata.json', JSON.stringify(allBooks, null, 2), 'utf8');
      console.log(' ✅ books_metadata.json synced successfully!');
    }
  } catch (err) {
    console.warn(' ⚠️ Failed to refresh books_metadata.json automatically:', err.message);
  }

  console.log('\n==================================================');
  console.log(`🎉 MIGRATION COMPLETE! Migrated ${migratedCount} books to Cloudflare R2.`);
  console.log('==================================================\n');
}

startMigration();
