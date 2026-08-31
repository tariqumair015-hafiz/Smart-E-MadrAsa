import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import axios from 'axios';

const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPdfUrls() {
  console.log('🔍 Checking PDF URLs in Supabase...\n');

  // Check specific book ID 19852 first
  const { data: book19852 } = await supabase.from('Books').select('id, title, pdf_url').eq('id', '19852').maybeSingle();
  if (book19852) {
    console.log(`Book 19852 URL: "${book19852.pdf_url}"`);
  }

  // Fetch 20 books with valid Archive.org or Cloudflare R2 working PDF URLs
  const { data: books, error } = await supabase
    .from('Books')
    .select('id, title, pdf_url, category')
    .not('pdf_url', 'is', null)
    .neq('pdf_url', '')
    .limit(50);

  if (error || !books) {
    console.error('Error fetching books:', error);
    return;
  }

  console.log(`Analyzing ${books.length} candidate books for live working PDF URLs...\n`);

  const workingArchiveBooks = [];

  for (const b of books) {
    if (!b.pdf_url) continue;

    // Skip Supabase storage URLs if dead/broken or check domain
    if (b.pdf_url.includes('archive.org') || b.pdf_url.includes('r2.dev') || b.pdf_url.includes('besturdu')) {
      // Test HTTP status of PDF URL
      try {
        const res = await axios.head(b.pdf_url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.status === 200) {
          workingArchiveBooks.push({
            id: b.id,
            title: b.title,
            category: b.category,
            pdf_url: b.pdf_url,
          });
          console.log(`✅ Live Working PDF URL: [${b.id}] "${b.title}" -> ${b.pdf_url.slice(0, 70)}...`);
        }
      } catch (e) {
        // try GET with range header
        try {
          const res = await axios.get(b.pdf_url, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-1024' }
          });
          if (res.status === 200 || res.status === 206) {
            workingArchiveBooks.push({
              id: b.id,
              title: b.title,
              category: b.category,
              pdf_url: b.pdf_url,
            });
            console.log(`✅ Live Working PDF URL: [${b.id}] "${b.title}" -> ${b.pdf_url.slice(0, 70)}...`);
          }
        } catch (err2) {
          console.log(`❌ Dead URL for [${b.id}] "${b.title}": ${b.pdf_url}`);
        }
      }
    } else {
      console.log(`⚠️ Non-archive/supabase URL for [${b.id}] "${b.title}": ${b.pdf_url}`);
    }

    if (workingArchiveBooks.length >= 5) break;
  }

  console.log('\n==================================================');
  console.log('📌 TOP WORKING ARCHIVE.ORG / CLOUDFLARE R2 BOOKS:');
  console.log('==================================================');
  console.log(JSON.stringify(workingArchiveBooks, null, 2));
}

checkPdfUrls();
