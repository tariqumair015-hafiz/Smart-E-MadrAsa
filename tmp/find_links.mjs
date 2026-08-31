import fs from 'fs';
import * as cheerio from 'cheerio';
const html = fs.readFileSync('tmp/fatawa_test.html', 'utf8');
const $ = cheerio.load(html);

const books = [];
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('https://besturdubooks.net/') && !href.includes('category') && !href.includes('tag') && !href.includes('author') && !href.includes('dars-e-nizami') && href.length > 30) {
        const title = $(el).text().trim() || $(el).find('img').attr('alt') || 'No Title';
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        if (title && title.length > 2 && !books.find(b => b.href === href)) {
            books.push({ href, title, img });
        }
    }
});
console.log('Found books:', books.slice(0, 10));
