import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const landingUrl = 'https://besturdubooks.net/dars-e-nizami-banat-girls/alamiyah-banat-second-year-books/';
  console.log("Fetching Landing Page...");
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

  for (let i = 0; i < booksToFix.length; i++) {
    const item = booksToFix[i];
    console.log(`[${i+1}/${booksToFix.length}] Fixing: ${item.title}`);
    
    try {
      const { data } = await axios.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(data);
      
      let bestImg = null;
      // prioritize .jpg images and skip tiny icons or large banners
      $('.entry-content img').each((idx, img) => {
         let src = $(img).attr('src');
         // Some use data-lazy-src or other attributes
         if (!src) src = $(img).attr('data-src') || $(img).attr('data-lazy-src');
         
         if (src && src.includes('besturdubooks.net/wp-content/uploads/') && 
             src.toLowerCase().endsWith('.jpg') && 
             !src.includes('logo') && !src.includes('banner') && !src.includes('header')) {
            bestImg = src;
            return false;
         }
      });
      
      // Fallback to any img if no .jpg found
      if (!bestImg) {
        $('.entry-content img').each((idx, img) => {
           let src = $(img).attr('src') || $(img).attr('data-src');
           if (src && src.includes('besturdubooks.net/wp-content/uploads/') && !src.includes('logo')) {
              bestImg = src;
              return false;
           }
        });
      }

      if (bestImg) {
        console.log(`  Found: ${bestImg}`);
        const { data: books } = await supabase
          .from('Books')
          .select('id')
          .eq('category', 'عالمیہ بنات سال دوم')
          .ilike('title', `%${item.title.substring(0, 15)}%`);

        if (books) {
          for (const b of books) {
             await supabase.from('Books').update({ cover_url: bestImg }).eq('id', b.id);
          }
        }
      } else {
        // Advanced: search database FOR THIS EXACT TITLE but from boys (8th year, etc)
        console.log(`  Searching DB for alternative version...`);
        const { data: dbMatches } = await supabase
           .from('Books')
           .select('cover_url')
           .ilike('title', `%${item.title.substring(0, 15)}%`)
           .ilike('cover_url', '%besturdubooks.net/wp-content%')
           .limit(1);
        
        if (dbMatches && dbMatches.length > 0) {
           console.log(`  Found in DB: ${dbMatches[0].cover_url}`);
           await supabase.from('Books')
             .update({ cover_url: dbMatches[0].cover_url })
             .eq('category', 'عالمیہ بنات سال دوم')
             .ilike('title', `%${item.title.substring(0, 15)}%`);
        }
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
    await delay(200);
  }
  console.log("ALL DONE!");
}

run().catch(e => console.error("FATAL ERROR:", e));
