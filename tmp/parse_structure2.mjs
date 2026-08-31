import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/dht_test.html', 'utf-8');
const $ = cheerio.load(html);

const content = $('.entry-content, .post-content').first();

let out = [];
content.children().each((i, el) => {
   const tagName = el.tagName.toLowerCase();
   
   if (tagName === 'p' || tagName === 'div' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
       const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
       const text = $(el).text().replace(/\n/g, ' ').trim().substring(0, 100);
       const links = $(el).find('a').length;

       if (img || links > 0 || tagName.startsWith('h')) {
           out.push(`[${tagName}] TEXT: ${text} | IMAGES: ${img ? 1 : 0} | LINKS: ${links}`);
       }
   }
});

fs.writeFileSync('tmp/parsed2.txt', out.join('\n'));
