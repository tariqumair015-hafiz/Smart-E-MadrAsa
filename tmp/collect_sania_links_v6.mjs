import https from 'https';
import { writeFileSync } from 'fs';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeSaniaBooks() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';
  let allBooks = [];

  console.log('--- Scraping Al-Sania (2nd Year) - 9 Pages ---');

  for (let page = 1; page <= 9; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
    console.log(`Processing Page ${page}: ${url}`);

    try {
      const html = await fetchPage(url);
      
      // Isolate the main content area to avoid sidebar/footer links
      const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
      if (!contentMatch) continue;
      
      const content = contentMatch[1];
      
      // Split by <hr /> or similar dividers
      const blocks = content.split(/<hr\s*\/?>/i);
      
      blocks.forEach(block => {
        // Extract Title: Look for strong tags in center-aligned paragraphs
        const titleMatch = block.match(/<p[^>]*text-align:\s*center[^>]*>[\s\S]*?<strong>([\s\S]*?)<\/strong>/i);
        // Extract Image
        const imgMatch = block.match(/<img[^>]*src="([^"]*)"/i);
        // Extract Links
        const links = [];
        const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(Link\s*\d+|Read\s*Online|آن\s*لائن\s*پڑھنے|ڈاونلوڈ)<\/a>/gi;
        let lMatch;
        while ((lMatch = linkRegex.exec(block)) !== null) {
          links.push(lMatch[1]);
        }

        if (titleMatch && links.length > 0) {
          const rawTitle = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          // Clean up titles (remove "Download" text if accidentally caught)
          if (rawTitle.length > 5 && !rawTitle.toLowerCase().includes('download')) {
             allBooks.push({
                title: rawTitle,
                image: imgMatch ? imgMatch[1] : null,
                links: links,
                page: page
              });
          }
        }
      });
      
      console.log(`  Extracted ${allBooks.length} books so far...`);
    } catch (e) {
      console.error(`  Error on page ${page}:`, e.message);
    }
  }

  writeFileSync('tmp/sania_full_data.json', JSON.stringify(allBooks, null, 2), 'utf8');
  console.log(`\nDONE! Saved ${allBooks.length} books to tmp/sania_full_data.json`);
}

scrapeSaniaBooks().catch(console.error);
