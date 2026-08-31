import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/';
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);
  
  // Book thumbnails are usually in a specific container, let's find all images that link to books.
  // In previous scraper we did: 
  // const img = $(el).find('img').attr('src');
  
  // Find all a tags inside h3, or a tags with img inside div with product class
  let count = 0;
  $('a').each((i, el) => {
     const href = $(el).attr('href');
     const img = $(el).find('img').length > 0;
     const text = $(el).text().trim();
     
     if (href && href.startsWith('https://besturdubooks.net/') && img && !href.includes('category') && href !== url) {
        console.log(`[${++count}] Link: ${href}`);
     }
  });

}
test();
