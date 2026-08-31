import https from 'https';
import { writeFileSync } from 'fs';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      console.log(`Fetching ${url} - Status: ${res.statusCode}`);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        console.log(`Redirecting to ${nextUrl}`);
        return fetchPage(nextUrl).then(resolve).catch(reject);
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
    
    try {
      const html = await fetchPage(url);
      console.log(`  HTML Length: ${html.length}`);
      
      // Super simple regex to catch anything matching the pattern
      const entryRegex = /class="entry-title"><a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/g;
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
      
      // If we found nothing, let's dump a snippet of the HTML for debugging
      if (count === 0 && html.length > 0) {
        console.log('  DEBUG: First 500 chars of HTML: ' + html.substring(0, 500));
        const index = html.indexOf('entry-title');
        if (index !== -1) {
          console.log('  DEBUG: Fragment around entry-title: ' + html.substring(index - 50, index + 200));
        }
      }

    } catch (e) {
      console.error(`  Error on page ${page}:`, e.message);
    }
  }

  writeFileSync('tmp/sania_book_links.json', JSON.stringify(bookData, null, 2), 'utf8');
  console.log(`\nSUCCESS: Extracted ${bookData.length} unique book links.`);
}

collectAllSaniaLinks().catch(console.error);
