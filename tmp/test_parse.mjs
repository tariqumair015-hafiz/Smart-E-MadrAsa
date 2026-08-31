import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/dht_test.html', 'utf-8');
const $ = cheerio.load(html);

let links = [];
$('a').each((i, el) => {
   const href = $(el).attr('href');
   if(href) links.push(href);
});
fs.writeFileSync('tmp/links.txt', links.join('\n'));
