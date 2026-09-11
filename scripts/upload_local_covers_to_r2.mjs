import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load credentials from env_config.json
const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const SUPABASE_URL = (env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = env.CLOUDFLARE_BUCKET_NAME;
const PUBLIC_DOMAIN = env.CLOUDFLARE_PUBLIC_DOMAIN.replace(/\/$/, '');

function getR2Signature(method, pathStr, bodyBuffer, contentType, dateStr, region = 'auto') {
  const service = 's3';
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const datestamp = dateStr.substring(0, 8);
  const payloadHash = crypto.createHash('sha256').update(bodyBuffer).digest('hex');
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${pathStr}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credentialScope}\n` + crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const kDate = crypto.createHmac('sha256', `AWS4${SECRET_ACCESS_KEY}`).update(datestamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  return `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function uploadToR2(key, buffer, contentType = 'image/jpeg') {
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const pathStr = `/${BUCKET_NAME}/${key}`;
  const url = `https://${host}${pathStr}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const authorization = getR2Signature('PUT', pathStr, buffer, contentType, dateStr);
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
      signal: AbortSignal.timeout(60000)
    });
    if (res.status === 200 || res.status === 204) {
      return `${PUBLIC_DOMAIN}/${key}`;
    }
  } catch (err) {
    console.error(` ❌ R2 Upload Error (${key}): ${err.message}`);
  }
  return null;
}

function findImageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findImageFiles(fullPath, fileList);
    } else if (/\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG)$/i.test(item)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function startLocalCoversUpload() {
  console.log('==================================================');
  console.log('🖼️ Local Covers to Cloudflare R2 Uploader');
  console.log('==================================================\n');

  const candidateDirs = [
    'C:\\Users\\IQRA TRADERS\\Desktop\\covers',
    'C:\\Users\\IQRA TRADERS\\Downloads\\covers (1)\\covers',
    'C:\\Users\\IQRA TRADERS\\Downloads\\covers (1)',
    'C:\\Users\\IQRA TRADERS\\Downloads\\covers',
  ];

  let targetDir = candidateDirs.find(d => fs.existsSync(d));

  if (!targetDir) {
    console.error('❌ Could not find covers folder! Please check path.');
    return;
  }

  console.log(`📁 Found covers directory: ${targetDir}`);
  const imageFiles = findImageFiles(targetDir);
  console.log(`📷 Found ${imageFiles.length} cover image files to process.\n`);

  const metadataPath = './books_metadata.json';
  const books = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : [];

  let uploadedCount = 0;
  let matchedCount = 0;
  const CONCURRENCY = 15;
  const queue = [...imageFiles];

  async function worker(workerId) {
    while (queue.length > 0) {
      const filePath = queue.shift();
      if (!filePath) break;

      const fileName = path.basename(filePath);
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

      const r2Key = `covers/${fileName}`;
      const r2Url = await uploadToR2(r2Key, buffer, contentType);

      if (r2Url) {
        uploadedCount++;
        console.log(`⚡ [Worker ${workerId}] Uploaded (${uploadedCount}/${imageFiles.length}): ${fileName} -> ${r2Url}`);

        const idMatch = fileName.match(/(\d+)/);
        if (idMatch) {
          const numId = parseInt(idMatch[1]);
          const bookIndex = books.findIndex(b => b.id === numId || (b.cover_url && b.cover_url.includes(fileName)));
          if (bookIndex !== -1) {
            books[bookIndex].cover_url = r2Url;
            matchedCount++;
            console.log(`  🎯 Matched & updated Book #${books[bookIndex].id}: "${books[bookIndex].title?.slice(0, 30)}"`);
          }
        }
      }
    }
  }

  console.log(`🚀 Launching ${CONCURRENCY} parallel upload streams...\n`);
  const workers = [];
  for (let w = 1; w <= CONCURRENCY; w++) {
    workers.push(worker(w));
  }
  await Promise.all(workers);

  if (books.length > 0) {
    fs.writeFileSync('./books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
    if (fs.existsSync('./public/books_metadata.json')) {
      fs.writeFileSync('./public/books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
    }
    console.log('\n✅ Updated books_metadata.json with new R2 cover URLs!');
  }

  console.log('\n==================================================');
  console.log(`🎉 COVERS UPLOAD COMPLETE! Uploaded: ${uploadedCount} covers | Matched: ${matchedCount} books.`);
  console.log('==================================================\n');
}

startLocalCoversUpload();
