import axios from 'axios';
import * as cheerio from 'cheerio';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';

for (let page = 1; page <= 9; page++) {
  const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 15000
    });
    const $ = cheerio.load(res.data);
    const imgs = $('.entry-content img');
    const links = $('.entry-content a[href*="archive.org/download"]');
    console.log(`Page ${page}: ${imgs.length} images, ${links.length} archive links`);
    
    // Print first 3 image srcs
    imgs.slice(0,3).each((i, el) => {
      const src = $(el).attr('data-lazy-src') || $(el).attr('data-src') || $(el).attr('src');
      console.log(`  img ${i+1}: ${src?.substring(0,80)}`);
    });
  } catch(e) {
    console.log(`Page ${page}: ERROR - ${e.message}`);
  }
}
