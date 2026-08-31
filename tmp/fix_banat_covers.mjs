import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const booksToFix = [
    { titleMatch: 'خلاصۃ التجوید', url: 'https://besturdubooks.net/khulasa-tut-tajweed/' },
    { titleMatch: 'جوامع الکلم', url: 'https://besturdubooks.net/jawamiul-kalim/' },
    { titleMatch: 'تعلیم الاسلام', directImg: 'https://archive.org/services/img/TaleemUlIslam' }
  ];

  for (const item of booksToFix) {
    let imgUrlToSet = item.directImg;

    if (item.url) {
       console.log(`Fetching ${item.url}...`);
       try {
         const { data } = await axios.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
         const $ = cheerio.load(data);
         
         // Sometimes images are wrapped in <p> or <figure>
         let img = $('.entry-content img').not('.swp_share_buttons img').first().attr('src') || $('img.wp-post-image').attr('src');
         
         // Fix protocol if missing
         if (img && img.startsWith('//')) {
             img = 'https:' + img;
         }

         if (img) {
            imgUrlToSet = img;
            console.log(`Found image: ${imgUrlToSet}`);
         } else {
            console.log(`Could not find image on page for ${item.titleMatch}`);
         }
       } catch (e) {
         console.error(`Error fetching ${item.url}:`, e.message);
       }
    }

    if (imgUrlToSet) {
       console.log(`Updating DB for ${item.titleMatch} with image: ${imgUrlToSet}`);
       const { data: books, error: fetchErr } = await supabase
         .from('Books')
         .select('id, title, category')
         .ilike('title', `%${item.titleMatch}%`)
         .eq('category', 'ثانویہ خاصہ سال اول')
         .limit(1);

       if (fetchErr || !books || books.length === 0) {
          console.error(`Could not find book for ${item.titleMatch} in DB`);
          continue;
       }

       const bookId = books[0].id;
       const { error: updErr } = await supabase
         .from('Books')
         .update({ cover_url: imgUrlToSet })
         .eq('id', bookId);

       if (updErr) {
          console.error(`Error updating book ${bookId}:`, updErr.message);
       } else {
          console.log(`Successfully updated cover for: ${books[0].title}`);
       }
    }
  }
}

run();
