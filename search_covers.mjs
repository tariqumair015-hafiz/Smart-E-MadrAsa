import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findCover(query, exclude) {
   const url = 'https://besturdubooks.net/?s=' + encodeURIComponent(query);
   try {
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(res.data);
      let foundCover = null;
      
      // loop through search result items
      $('.hentry').each((i, el) => {
          if (foundCover) return;
          const img = $(el).find('img');
          const title = $(el).find('.entry-title').text() || img.attr('alt') || '';
          
          let coverUrl = img.attr('data-lazy-src') || img.attr('src') || '';
          
          if (coverUrl && !coverUrl.includes('placeholder')) {
             if (coverUrl.includes('i2.wp.com') || coverUrl.includes('i0.wp.com')) {
               coverUrl = coverUrl.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
             }
             // Avoid covers with exact urdu words if exclude is set
             if (exclude && exclude.some(ex => title.toLowerCase().includes(ex.toLowerCase()))) {
                return; // skip this
             }
             foundCover = coverUrl;
          }
      });
      return foundCover;
   } catch(e) {
      console.log('Err for ' + query, e.message);
   }
   return null;
}

async function run() {
  console.log('Searching besturdubooks for true core covers...');

  const kanz = await findCover('Kanz ud Daqaiq', ['Urdu', 'Sharh', 'شرح', 'اردو']);
  console.log('Found Kanz:', kanz);

  const noor = await findCover('Noor ul Anwar', ['Urdu', 'Sharh', 'شرح', 'اردو']);
  console.log('Found Noor:', noor);

  const maqamat = await findCover('Maqamat e Hariri', ['Urdu', 'Sharh', 'شرح', 'اردو']);
  console.log('Found Maqamat:', maqamat);

  const balagha = await findCover('Al Balaghat ul Waziha', ['Urdu', 'Sharh', 'شرح', 'اردو']);
  console.log('Found Balagha:', balagha);

  // Apply to supasbase
  if(kanz) await supabase.from('Books').update({cover_url: kanz}).eq('title', 'Kanz ud Daqaiq كنـز الـدقـائـق');
  if(noor) await supabase.from('Books').update({cover_url: noor}).eq('title', 'Noor ul Anwar نـور الانـوار');
  if(maqamat) await supabase.from('Books').update({cover_url: maqamat}).eq('title', 'Maqamat e Hariri مـقامات حـریری');
  if(balagha) await supabase.from('Books').update({cover_url: balagha}).eq('title', 'Al Balaghat ul Wazeha البلاغۃ الواضحۃ');
  
  // also what about "شرح جامی"? Let's verify its cover.
  // The user only complained about the 4 books they showed in image, which got commentary covers.
  
  console.log('Covers applied.');
}

run();
