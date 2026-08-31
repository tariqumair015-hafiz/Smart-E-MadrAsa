import axios from 'axios';
import * as cheerio from 'cheerio';

async function testAllPages() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/';
  for (let page = 1; page <= 6; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(data);
      const images = $('.entry-content img, .post-content img').length;
      console.log(`Page ${page}: ${images} images found`);
    } catch (err) {
      console.log(`Page ${page}: Error: ${err.message}`);
    }
  }
}
testAllPages();
