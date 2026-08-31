import https from 'https';
import { writeFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeSania() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';
  const allBooks = [];
  
  console.log('--- Starting Scrape for 2nd Year (9 Pages) ---');
  
  for (let page = 1; page <= 9; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
    console.log(`Scraping Page ${page}: ${url}`);
    
    try {
      const html = await fetchPage(url);
      
      // Pattern to extract book details
      const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/g;
      let match;
      
      while ((match = articleRegex.exec(html)) !== null) {
        const article = match[1];
        
        // Extract Title
        const titleMatch = article.match(/<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*>(.*?)<\/a>/);
        let title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        
        // Extract Cover Image
        const coverMatch = article.match(/<img[^>]*src="([^"]*)"/);
        const coverUrl = coverMatch ? coverMatch[1] : '';
        
        // Extract Detail Link
        const detailLinkMatch = article.match(/<a\s+href="([^"]*besturdubooks\.net[^"]*)"/);
        const detailLink = detailLinkMatch ? detailLinkMatch[1] : '';

        if (title && detailLink) {
          allBooks.push({ title, coverUrl, detailLink });
        }
      }
      console.log(`  Found ${allBooks.length} books so far...`);
    } catch (e) {
      console.error(`  Error on page ${page}:`, e.message);
    }
  }

  writeFileSync('tmp/sania_scraped_raw.json', JSON.stringify(allBooks, null, 2), 'utf8');
  console.log(`\nDONE: Scraped ${allBooks.length} books total.`);
}

scrapeSania().catch(console.error);
