import axios from 'axios';
import * as cheerio from 'cheerio';

async function testAll() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/';
  for (let i = 1; i <= 6; i++) {
    const url = i === 1 ? baseUrl : `${baseUrl}${i}/`;
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);
      const images = $('.entry-content img').length;
      console.log(`Page ${i}: ${images} images (URL: ${url})`);
    } catch (err) {
      console.log(`Page ${i}: Error: ${err.message}`);
    }
  }
}
testAll();
