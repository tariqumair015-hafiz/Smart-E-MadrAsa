import axios from 'axios';
import * as cheerio from 'cheerio';

async function testPage3() {
  const url = 'https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/3/';
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);
  const titles = [];
  $('.entry-content img, .post-content img').each((i, el) => titles.push($(el).attr('alt') || 'No Alt'));
  console.log(titles);
}
testPage3();
