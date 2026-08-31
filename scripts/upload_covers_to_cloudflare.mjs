import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';

const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = env.CLOUDFLARE_BUCKET_NAME;
const PUBLIC_DOMAIN = env.CLOUDFLARE_PUBLIC_DOMAIN.replace(/\/$/, '');

/**
 * Generate AWS SigV4 signed authorization header for S3 PUT request to Cloudflare R2
 */
function getR2Signature(method, path, body, contentType, dateStr, region = 'auto') {
  const service = 's3';
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  
  const datestamp = dateStr.substring(0, 8); // YYYYMMDD
  
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
  
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
  
  const authorization = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return { authorization, payloadHash, host };
}

/**
 * Upload buffer to Cloudflare R2 bucket
 */
async function uploadToR2(key, buffer, contentType = 'image/jpeg') {
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${BUCKET_NAME}/${key}`;
  const url = `https://${host}${path}`;
  
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, ''); // YYYYMMDDTHHMMSSZ
  
  const { authorization, payloadHash } = getR2Signature('PUT', path, buffer, contentType, dateStr);
  
  try {
    const res = await axios.put(url, buffer, {
      headers: {
        'Content-Type': contentType,
        'Host': host,
        'x-amz-date': dateStr,
        'x-amz-content-sha256': payloadHash,
        'Authorization': authorization,
      },
      timeout: 30000,
    });
    
    if (res.status === 200 || res.status === 204) {
      return `${PUBLIC_DOMAIN}/${key}`;
    }
  } catch (err) {
    console.error(`R2 Upload error for ${key}:`, err.response?.data || err.message);
  }
  return null;
}

/**
 * Main migration runner for covers
 */
async function syncCoversToCloudflare() {
  console.log('--- Syncing Covers to Cloudflare R2 ---');
  
  // Fetch books where cover_url is not already on Cloudflare R2 public domain
  const { data: books, error } = await supabase
    .from('Books')
    .select('id, title, cover_url')
    .not('cover_url', 'is', null)
    .neq('cover_url', '')
    .limit(20);

  if (error || !books) {
    console.error('Error fetching books for cover sync:', error);
    return;
  }

  const toMigrate = books.filter(b => !b.cover_url.includes(PUBLIC_DOMAIN));
  console.log(`Found ${toMigrate.length} covers to migrate to Cloudflare R2.`);

  let successCount = 0;
  for (const book of toMigrate) {
    try {
      console.log(`Downloading cover for "${book.title}"...`);
      const imgRes = await axios.get(book.cover_url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const buffer = Buffer.from(imgRes.data);
      const key = `covers/${book.id}.jpg`;
      
      const r2Url = await uploadToR2(key, buffer, 'image/jpeg');
      if (r2Url) {
        await supabase.from('Books').update({ cover_url: r2Url }).eq('id', book.id);
        console.log(`✅ Uploaded to R2 & updated Supabase: ${r2Url}`);
        successCount++;
      } else {
        console.log(`❌ Failed to upload cover for "${book.title}"`);
      }
    } catch (err) {
      console.error(`Error processing cover for ${book.title}:`, err.message);
    }
  }

  console.log(`\n🎉 Cover migration completed! ${successCount} covers synced to Cloudflare R2.`);
}

syncCoversToCloudflare();
