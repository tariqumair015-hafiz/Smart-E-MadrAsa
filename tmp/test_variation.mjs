import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDeep() {
  for (let page = 1; page <= 3; page++) {
    const url = page === 1 ? 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/' : `https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/page/${page}/`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const titles = [];
    $('.entry-content img').each((i, el) => {
        titles.push($(el).attr('alt')?.substring(0, 30));
    });
    console.log(`Page ${page}: First 3 titles: ${titles.slice(0, 3).join(', ')}`);
  }
}
testDeep();
