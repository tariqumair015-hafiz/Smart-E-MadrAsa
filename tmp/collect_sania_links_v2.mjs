import https from 'https';
import { writeFileSync } from 'fs';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(new URL(res.headers.location, url).href).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function collectAllSaniaLinks() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';
  const allLinks = new Set();
  const bookData = [];
  
  console.log('--- Collecting Book Links from 9 Pages ---');
  
  for (let page = 1; page <= 9; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
    console.log(`Processing Page ${page}...`);
    
    try {
      const html = await fetchPage(url);
      
      // Flexible regex to account for potential spaces and variations
      const entryRegex = /<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
      let match;
      let count = 0;
      
      while ((match = entryRegex.exec(html)) !== null) {
        const link = match[1];
        const title = match[2].replace(/<[^>]*>/g, '').trim();
        
        if (!allLinks.has(link)) {
          allLinks.add(link);
          bookData.push({ title, link });
          count++;
        }
      }
      console.log(`  Found ${count} unique books on page ${page}. (Total: ${allLinks.size})`);
    } catch (e) {
      console.error(`  Error on page ${page}:`, e.message);
    }
  }

  writeFileSync('tmp/sania_book_links.json', JSON.stringify(bookData, null, 2), 'utf8');
  console.log(`\nSUCCESS: Extracted ${bookData.length} unique book links.`);
}

collectAllSaniaLinks().catch(console.error);
