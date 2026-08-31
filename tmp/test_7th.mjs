import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/';
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);
  
  let count = 0;
  $('a').each((i, el) => {
     const href = $(el).attr('href');
     const img = $(el).find('img').length > 0;
     const text = $(el).text().trim();
     
     if (href && href.startsWith('https://besturdubooks.net/') && img && !href.includes('category') && href !== url) {
        console.log(`[LINK] ${href}`);
        count++;
     }
  });
  console.log(`Total image links: ${count}`);
}
test();
