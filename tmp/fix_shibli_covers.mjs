import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const booksToFix = [
  { id: 16692, url: 'https://besturdubooks.net/maqalat-e-shibli/' },
  { id: 15772, url: 'https://besturdubooks.net/al-farooq/' },
  { id: 20684, url: 'https://besturdubooks.net/seerat-un-noman/' },
  { id: 20685, url: 'https://besturdubooks.net/al-ghazali/' }
];

async function fix() {
  for (const book of booksToFix) {
    console.log(`Fixing book ID ${book.id} - ${book.url}`);
    try {
      const resp = await axios.get(book.url);
      const $ = cheerio.load(resp.data);
      let newCover = null;
      
      const allImgs = [];
      $('img').each((idx, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && src.toLowerCase().endsWith('.jpg') && !src.includes('logo') && !src.includes('banner')) {
            allImgs.push(src);
        }
      });
      
      // Look for the specific non-ad images
      // Usually the correct cover is one of the first ones that contains 'new.asasulquran.com' or has a long path without 'ISLAHI'
      newCover = allImgs.find(src => (src.includes('new.asasulquran.com') && !src.includes('ISLAHI') && !src.includes('TADVEEN') && !src.includes('Masabeeh')));
      
      if (!newCover) {
         newCover = allImgs.find(src => (!src.includes('ISLAHI') && !src.includes('TADVEEN') && !src.includes('Masabeeh') && src.includes('uploads')));
      }

      if (newCover) {
        console.log(`Found real cover: ${newCover}`);
        const { error } = await supabase.from('Books').update({ cover_url: newCover }).eq('id', book.id);
        if (error) {
             console.log(`Error updating DB: `, error);
        } else {
             console.log(`Updated ID ${book.id}`);
        }
      } else {
        console.log(`Could not find real cover for ID ${book.id}`);
        console.log("Available imgs: ", allImgs);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

fix();
