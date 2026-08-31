import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('tmp/7th_test.html', 'utf-8');
const $ = cheerio.load(html);

const content = $('.entry-content, .post-content').first();
let out = [];

let logs = 0;
content.children().each((i, el) => {
   if (logs > 10) return;
   const img = $(el).find('img');
   if (img.length > 0) {
       out.push(`[IMG ${logs+1}] text: ${$(el).text().trim()}`);
       out.push(`  HTML: ${$(el).html().substring(0, 500)}`);
       out.push(`  [PREV] text: ${$(el).prev().text().trim()}`);
       out.push(`  [PREV HTML] ${$(el).prev().html()?.substring(0, 200)}`);
       out.push(`  [NEXT] text: ${$(el).next().text().replace(/\n/g, ' ').trim().substring(0, 100)}`);
       out.push(`-------`);
       logs++;
   }
});
fs.writeFileSync('tmp/7th_html_dump.txt', out.join('\n'));
