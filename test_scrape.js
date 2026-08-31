
import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'https://besturdubooks.net/page/301/';
  try {
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    
    $('article').each((i, el) => {
      const title = $(el).find('h2.entry-title').text().trim();
      const link = $(el).find('h2.entry-title a').attr('href');
      const img = $(el).find('img').first().attr('src');
      console.log(`- Title: ${title}`);
      console.log(`  Link: ${link}`);
      console.log(`  Img: ${img}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
