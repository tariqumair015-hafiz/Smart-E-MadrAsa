import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/dht_test.html', 'utf-8');
const $ = cheerio.load(html);

const content = $('.entry-content, .post-content').first();

let out = [];
content.children().each((i, el) => {
   const tagName = el.tagName.toLowerCase();
   
   if (tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
       out.push(`\n[HEADING] ${$(el).text().trim()}`);
   } else if (tagName === 'p' || tagName === 'div') {
       const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
       if (img) out.push(`[IMAGE] ${img}`);

       $(el).find('a').each((j, a) => {
           const href = $(a).attr('href');
           const text = $(a).text().trim();
           if(href && (href.includes('.pdf') || href.includes('archive.org') || href.includes('mediafire'))) {
               out.push(`  -> [LINK] ${text} | ${href}`);
           }
       });
   }
});

fs.writeFileSync('tmp/parsed.txt', out.join('\n'));
