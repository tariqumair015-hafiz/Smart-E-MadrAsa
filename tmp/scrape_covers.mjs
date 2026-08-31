// Scrape cover images from besturdubooks.net for the corrupted books
// The books were scraped from pages in the DarsENizami_DarjaAula category
// Let's scrape the actual listing pages to find cover URLs

import https from 'https';
import { writeFileSync } from 'fs';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeCovers() {
  // Scrape the category listing pages for 1st year
  const baseUrl = 'https://besturdubooks.net/category/dars-e-nizami-boys/darjaaula-1st-year/';
  const results = [];
  
  for (let page = 1; page <= 11; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
    console.log(`Scraping page ${page}: ${url}`);
    
    try {
      const html = await fetchPage(url);
      
      // Extract book entries: title + cover image + link
      // Pattern: <article> blocks with featured images
      const articleRegex = /<article[^>]*>[\s\S]*?<\/article>/g;
      let match;
      while ((match = articleRegex.exec(html)) !== null) {
        const article = match[0];
        
        // Extract title
        const titleMatch = article.match(/<h2[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*>(.*?)<\/a>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        
        // Extract link
        const linkMatch = article.match(/<a\s+href="([^"]*besturdubooks\.net[^"]*)"/);
        const link = linkMatch ? linkMatch[1] : '';
        
        // Extract cover image
        const imgMatch = article.match(/<img[^>]*src="([^"]*)"[^>]*>/);
        const cover = imgMatch ? imgMatch[1] : '';
        
        if (title) {
          results.push({ title: title.substring(0, 80), cover, link: link.substring(0, 120) });
        }
      }
    } catch (e) {
      console.log(`  Error page ${page}: ${e.message}`);
    }
  }
  
  writeFileSync('tmp/scraped_covers.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nScraped ${results.length} books total`);
}

scrapeCovers().catch(console.error);
