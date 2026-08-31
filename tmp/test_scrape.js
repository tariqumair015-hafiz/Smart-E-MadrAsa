import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFetch() {
  try {
    const { data } = await axios.get('https://besturdubooks.net/category/fatawa/');
    const $ = cheerio.load(data);
    const books = [];
    $('.post, .item, .product, article').each((i, el) => {
        // try finding the links
        const a = $(el).find('a').first();
        const title = $(el).find('h2, h3, .title').text().trim();
        books.push(title || a.attr('title') || 'No Title');
    });
    console.log(books.slice(0, 5));
  } catch (e) {
    console.error(e.message);
  }
}
testFetch();
