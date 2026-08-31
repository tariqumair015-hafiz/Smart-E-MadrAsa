import * as cheerio from 'cheerio';
import axios from 'axios';
import https from 'https';

const url = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/';

const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: false });
const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, httpsAgent: agent, timeout: 45000 });
const htmlText = res.data;

const $ = cheerio.load(htmlText);
const content = $('.entry-content, .post-content').first();
const images = content.find('img');

let out = `Found ${images.length} images.\n`;

for (let i = 0; i < Math.min(images.length, 3); i++) {
  out += `\n\n=== IMAGE ${i} ===\n`;
  const img = $(images[i]);
  const scan = img.closest('.entry-content > *');
  
  if (scan.length) {
      out += '--- Parent outerHTML ---\n';
      out += scan.prop('outerHTML') + '\n';
      
      out += '--- Next 20 Siblings outerHTML ---\n';
      let next = scan.next();
      for(let j=0; j<20; j++) {
         if (next.length) {
             out += `[Next ${j}]: ` + next.prop('outerHTML') + '\n';
             next = next.next();
         }
      }
  } else {
      out += 'No top-level child found.\n';
  }
}

import fs from 'fs';
fs.writeFileSync('inspect2.txt', out, 'utf8');
