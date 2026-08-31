/**
 * Fix 7th Year Textbook Cover Images
 * 
 * Strategy:
 * 1. Visit each book's dedicated page on besturdubooks.net
 * 2. Extract og:image meta tag (WordPress featured image)
 * 3. Update the cover_url in Supabase
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';

// Map: partial title match → besturdubooks.net individual page URL
const BOOK_PAGES = [
  { match: 'Tafseer e Baizawi تفسیر بیضاوی مکمل', page: 'https://besturdubooks.net/tafseer-e-baizawi/' },
  { match: 'Tafseer e Baizawi Al Bushra', page: 'https://besturdubooks.net/tafseer-e-baizawi-al-bushra/' },
  { match: 'Tafseer e Baizawi Meer Muhammad', page: 'https://besturdubooks.net/tafseer-e-baizawi-meer-muhammad/' },
  { match: 'Tafseer e Baizawi Rahmania', page: 'https://besturdubooks.net/tafseer-e-baizawi-rahmania/' },
  { match: 'Tafseer e Baizawi Rashidia', page: 'https://besturdubooks.net/tafseer-e-baizawi-rashidia/' },
  { match: 'AL Tibyan', page: 'https://besturdubooks.net/al-tibyan/' },
  { match: 'Mishkat ul Masabih Al Bushra', page: 'https://besturdubooks.net/mishkat-ul-masabih/' },
  { match: 'Mishkat ul Masabih Qadimi', page: 'https://besturdubooks.net/mishkat-ul-masabih-qadimi/' },
  { match: 'Mishkat ul Masabih Rahmania', page: 'https://besturdubooks.net/mishkat-ul-masabih-rahmania/' },
  { match: 'Mishkat ul Masabeeh Urdu', page: 'https://besturdubooks.net/mishkat-ul-masabih-urdu/' },
  { match: 'Al Hidaya Al Bushra Vol 5-8', page: 'https://besturdubooks.net/al-hidayah/' },
  { match: 'Al Hidaya Rahmania', page: 'https://besturdubooks.net/al-hidayah-rahmania/' },
  { match: 'Al Hidaya Rashidia', page: 'https://besturdubooks.net/al-hidayah-rasheediya/' },
  { match: 'Nukhbatul Fikar', page: 'https://besturdubooks.net/nukhbat-ul-fikar/' },
  { match: 'Nuzha tun Nazar', page: 'https://besturdubooks.net/nuzhat-un-nazar/' },
  { match: 'Taiseer e Mustalah', page: 'https://besturdubooks.net/taiseer-e-mustalah-ul-hadith/' },
  { match: 'Al Mutawwal', page: 'https://besturdubooks.net/al-mutawwal/' },
  { match: "Al Hai'at Ul Wusta", page: 'https://besturdubooks.net/al-haiat-ul-wusta/' },
];

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getOgImage(url) {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
      timeout: 30000,
    });
    const $ = cheerio.load(res.data);
    
    // Try og:image first
    let img = $('meta[property="og:image"]').attr('content');
    if (img) {
      // Clean WordPress CDN artifacts
      img = img.replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
      return img;
    }
    
    // Try first content image
    img = $('.entry-content img').first().attr('src');
    if (img) {
      img = img.replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
      return img;
    }
    
    // Try wp:image
    img = $('.wp-block-image img, .wp-block-kadence-image img').first().attr('src');
    if (img) {
      img = img.replace(/\?w=\d+/, '').replace(/-\d+x\d+(?=\.\w+$)/, '');
      return img;
    }
    
    return null;
  } catch (err) {
    console.log(`  ⚠️  Error fetching ${url}: ${err.message}`);
    
    // Try alternate URL patterns
    const altUrls = [
      url.replace(/\/$/, '') + '-pdf/',
      url.replace(/\/$/, '') + '-book/',
    ];
    for (const alt of altUrls) {
      try {
        const res2 = await axios.get(alt, {
          headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' },
          timeout: 15000,
        });
        const $2 = cheerio.load(res2.data);
        const img2 = $2('meta[property="og:image"]').attr('content');
        if (img2) return img2.replace(/\?w=\d+/, '');
      } catch(e) { /* skip */ }
    }
    
    return null;
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all 7th year textbooks
  const { data: books, error: fetchErr } = await supabase.from('Books')
    .select('id, title, cover_url')
    .eq('category', 'درجہ سابعہ')
    .eq('sub_category', 'درسی کتب');
    
  if (fetchErr) { console.error('Fetch error:', fetchErr.message); return; }
  console.log(`📚 Found ${books.length} books to fix covers for\n`);

  let updated = 0, skipped = 0, failed = 0;

  for (const book of books) {
    // Find matching page URL
    const mapping = BOOK_PAGES.find(m => book.title.includes(m.match));
    if (!mapping) {
      console.log(`⏩ No page mapping for: ${book.title.substring(0, 50)}`);
      skipped++;
      continue;
    }

    console.log(`🔍 ${book.title.substring(0, 50)}`);
    console.log(`   Page: ${mapping.page}`);
    
    const ogImage = await getOgImage(mapping.page);
    
    if (ogImage) {
      console.log(`   ✅ Cover found: ${ogImage.substring(0, 70)}`);
      
      const { error: upErr } = await supabase.from('Books')
        .update({ cover_url: ogImage })
        .eq('id', book.id);
      
      if (upErr) {
        console.log(`   ❌ Update failed: ${upErr.message}`);
        failed++;
      } else {
        updated++;
      }
    } else {
      console.log(`   ⚠️  No cover found, keeping existing`);
      skipped++;
    }

    // Be polite to the server
    await delay(1500);
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}, Failed: ${failed}`);
}

main().catch(console.error);
