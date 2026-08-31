import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
  const url = 'http://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-arabic-shuroohat/';
  try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);
      
      const content = $('.entry-content, .post-content').first();
      let count = 0;
      
      if (content.length > 0) {
          const images = content.find('img');
          console.log(`Found ${images.length} images inside entry-content.`);
          images.each((i, el) => {
              const img = $(el);
              let title = img.attr('alt') || img.attr('title') || '';
              console.log(`[IMG ${i+1}] Title: ${title}`);
              count++;
          });
      } else {
          console.log('No .entry-content found, might be a standard shop archive.');
          $('.product').each((i, el) => {
             console.log(`[PRODUCT] ${$(el).find('h2').text()}`);
             count++;
          });
      }
      console.log(`Total found: ${count}`);
  } catch (err) {
      console.error(err.message);
  }
}
test();
