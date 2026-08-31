import fs from 'fs';
import * as cheerio from 'cheerio';
const html = fs.readFileSync('tmp/quran_test.html', 'utf8');
const $ = cheerio.load(html);

const links = [];
$('a').each((i, el) => {
    const href = $(el).attr('href');
    const title = $(el).find('img').attr('alt') || $(el).attr('title') || $(el).text().trim();
    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
    if (href && href.startsWith('https://besturdubooks.net/') && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/author/') && !href.includes('/page/') && href.length > 30 && img) {
        links.push({ href, title, img });
    }
});
const unique = [...new Map(links.map(item => [item.href, item])).values()];
console.log('Found book cards:', unique.length);
console.log('Sample:', unique.slice(0, 3));
