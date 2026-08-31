import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(data);
  const links = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const title = $(el).find('img').attr('alt') || $(el).attr('title') || $(el).text().trim();
    const img = $(el).find('img').attr('src');
    if (href && href.startsWith('https://besturdubooks.net/') && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/author/') && !href.includes('/dars-e-nizami/')) {
       links.push({ href, title, img });
    }
  });
  console.log('Links found:', links.length);
  if (links.length > 0) {
     console.log('First link:', links[0]);
  }
}
test();
