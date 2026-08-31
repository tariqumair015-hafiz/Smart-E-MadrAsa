import axios from 'axios';
import * as cheerio from 'cheerio';

async function compare() {
  const urls = [
    'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/page/2/',
    'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/2/'
  ];
  for (const url of urls) {
     try {
       const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
       const $ = cheerio.load(data);
       const titles = [];
       $('.entry-content img').each((i, el) => titles.push($(el).attr('alt')?.substring(0, 30)));
       console.log(`URL: ${url}`);
       console.log(`  Titles (first 3): ${titles.slice(0, 3).join(', ')}`);
       console.log(`  Total images: ${titles.length}`);
     } catch (err) {
       console.log(`URL: ${url} - Error: ${err.message}`);
     }
  }
}
compare();
