import * as cheerio from 'cheerio';
import fs from 'fs';
const html = fs.readFileSync('tmp/fatawa_test.html', 'utf8');
const $ = cheerio.load(html);

const h2s = [];
$('h2').each((i, el) => {
  const text = $(el).text().trim();
  const href = $(el).find('a').attr('href');
  if (text) h2s.push({text, href, class: $(el).attr('class')});
});
console.log('h2 elements:', h2s.slice(0, 15));

const links = [];
$('a').each((i, el) => {
  const href = $(el).attr('href');
  if (href && href.includes('besturdubooks') && !href.includes('category') && !href.includes('tag')) {
    links.push({href, text: $(el).text().trim(), parentClass: $(el).parent().attr('class')});
  }
});
console.log('potential book links:', links.slice(0, 5));
