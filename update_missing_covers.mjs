import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY = 'درجہ سادسہ';

async function findCoverFromBestUrdu(title) {
  const searchUrl = 'https://besturdubooks.net/?s=' + encodeURIComponent(title);
  try {
    const res = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    // iterate over results, pick first img that looks like a book cover
    const img = $('.hentry img').filter((i, el) => {
      const src = $(el).attr('data-lazy-src') || $(el).attr('src') || '';
      return src && !src.includes('placeholder') && !src.includes('logo');
    }).first();
    if (img && img.length) {
      let url = img.attr('data-lazy-src') || img.attr('src') || '';
      if (url.includes('i2.wp.com') || url.includes('i0.wp.com') || url.includes('i1.wp.com')) {
        url = url.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
      } else if (url.includes('?')) {
        url = url.split('?')[0];
      }
      return url;
    }
  } catch (e) {
    console.log('Search error for', title, e.message);
  }
  return null;
}

async function fixMissingCovers() {
  const { data: books, error } = await supabase.from('Books')
    .select('id, title, cover_url')
    .eq('category', CATEGORY)
    .eq('sub_category', 'درسی کتب');
  if (error) { console.log('DB fetch error', error.message); return; }

  const toFix = books.filter(b => !b.cover_url || b.cover_url.includes('archive.org/services/img'));
  console.log(`Found ${toFix.length} books with missing/placeholder covers.`);

  for (const book of toFix) {
    const cover = await findCoverFromBestUrdu(book.title);
    if (cover) {
      const { error: upd } = await supabase.from('Books').update({ cover_url: cover }).eq('id', book.id);
      if (upd) console.log('Update error for', book.title, upd.message);
      else console.log('✅ Updated cover for', book.title);
    } else {
      console.log('⚠️ Could not find cover for', book.title);
    }
  }
}

fixMissingCovers();
