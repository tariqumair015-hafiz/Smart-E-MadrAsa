import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const landingUrl = 'https://besturdubooks.net/dars-e-nizami-banat-girls/alamiyah-banat-second-year-books/';
  console.log("Fetching Landing Page to find real URLs...");
  const { data: landingHtml } = await axios.get(landingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
  
  const $l = cheerio.load(landingHtml);
  const booksToFix = [];
  
  $l('.entry-content a').each((i, el) => {
    const href = $l(el).attr('href');
    const text = $l(el).text().trim();
    if (href && href.startsWith('https://besturdubooks.net/') && href.length > 30) {
       booksToFix.push({ title: text, url: href });
    }
  });

  console.log(`Found ${booksToFix.length} links to process.`);

  for (let i = 0; i < booksToFix.length; i++) {
    const item = booksToFix[i];
    console.log(`[${i+1}/${booksToFix.length}] Fixing: ${item.title}`);
    
    try {
      const { data } = await axios.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(data);
      
      // Look for images hosted on besturdubooks.net
      let bestImg = null;
      $('img').each((idx, img) => {
         const src = $(img).attr('src');
         if (src && src.includes('besturdubooks.net/wp-content/uploads/') && !src.includes('logo')) {
            bestImg = src;
            return false; // break
         }
      });

      if (bestImg) {
        console.log(`  Found stable image: ${bestImg}`);
        const { data: books } = await supabase
          .from('Books')
          .select('id, title')
          .eq('category', 'عالمیہ بنات سال دوم')
          .ilike('title', `%${item.title.substring(0, 15)}%`);

        if (books && books.length > 0) {
          for (const b of books) {
             const { error } = await supabase.from('Books').update({ cover_url: bestImg }).eq('id', b.id);
             if(!error) console.log(`  Updated: ${b.title}`);
          }
        }
      } else {
        console.log(`  No stable image on page. Searching database...`);
        // Fallback: search database for THIS title but for boys section or any working one
        const { data: dbMatch } = await supabase
           .from('Books')
           .select('cover_url')
           .ilike('title', `%${item.title.substring(0, 15)}%`)
           .ilike('cover_url', '%besturdubooks.net/wp-content%')
           .limit(1);
        
        if (dbMatch && dbMatch.length > 0) {
           console.log(`  Found stable image in DB: ${dbMatch[0].cover_url}`);
           await supabase.from('Books')
             .update({ cover_url: dbMatch[0].cover_url })
             .eq('category', 'عالمیہ بنات سال دوم')
             .ilike('title', `%${item.title.substring(0, 15)}%`);
        }
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
    await delay(300);
  }
}

run();
