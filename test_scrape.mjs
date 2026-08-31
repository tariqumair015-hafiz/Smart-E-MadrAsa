import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(res.data);
  const links = [];
  $('.ast-grid-common-col .ast-blog-featured-section a, article .entry-title a, .type-post h2 a').each((i, el) => {
    links.push($(el).attr('href'));
  });
  console.log(`Found ${links.length} links`);
  console.log(links.slice(0, 5));
}
test();
