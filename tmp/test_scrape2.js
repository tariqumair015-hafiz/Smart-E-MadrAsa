import axios from 'axios';
import * as cheerio from 'cheerio';

async function getBooks() {
  try {
    const { data } = await axios.get('https://besturdubooks.net/category/fatawa/');
    const $ = cheerio.load(data);
    const books = [];
    $('article').each((i, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href');
      const title = $(el).find('h2, .title').text().trim();
      const img = $(el).find('img').attr('src');
      if (href) books.push({ title, href, img });
    });
    console.log("Found:", books[0]);
    
    // Visit the first one to find pdf link
    if(books[0] && books[0].href) {
      const res = await axios.get(books[0].href);
      const $2 = cheerio.load(res.data);
      let pdfLink = '';
      $2('a').each((i, el) => {
        const h = $2(el).attr('href');
        if (h && (h.includes('.pdf') || h.includes('download'))) {
          pdfLink = h;
          // check if it's the direct link we want
          if (pdfLink.includes('pdf')) {
             return false; // break
          }
        }
      });
      console.log("PDF Link:", pdfLink);
    }
  } catch (e) {
    console.error(e.message);
  }
}
getBooks();
