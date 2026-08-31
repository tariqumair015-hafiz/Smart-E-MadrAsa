import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CATEGORY = 'درجہ سادسہ';

// Read original scraped data (these covers were correctly scraped per-book)
const scraped = JSON.parse(fs.readFileSync('sadesa_final_books.json', 'utf8'));

// Build a lookup: title -> cover_url (from original scrape)
const scrapedMap = {};
for (const b of scraped) {
  scrapedMap[b.title.trim()] = b.cover_url;
}

// Verified covers ONLY for core textbooks (not commentaries!)
const textbookCovers = {
  'Tafseer': 'https://besturdubooks.net/wp-content/uploads/2018/10/Tafseer-Ul-Jalalain.jpg',
  'Fauzul Kabeer': 'https://besturdubooks.net/wp-content/uploads/2021/11/Al-Fawz-ul-Kabeer-Al-Bushra.jpg',
  'Khair ul Usool': 'https://besturdubooks.net/wp-content/uploads/2024/05/Mueen_ul_Usool.jpg',
  'Siraji fil Miras': 'https://besturdubooks.net/wp-content/uploads/2018/10/AlSirajiFilMeras.jpg',
  'Kitab ul Aasar': 'https://besturdubooks.net/wp-content/uploads/2018/10/Kitab-ul-Asar.jpg',
  'Hidayah Vol 2': 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Hidayah.jpg',
  'Tauzeeh Mukammal': 'https://besturdubooks.net/wp-content/uploads/2022/01/AL_TAOZEEH_Al_TALWEEH-NOOR-MUHAMMAD.jpg',
  'Sharh Aqaid': 'https://besturdubooks.net/wp-content/uploads/2018/10/Sharh-ul-Aqaid.jpg',
  'Deoband': 'https://besturdubooks.net/wp-content/uploads/2025/02/ULAMA_E_DEOBAND_KA_DEENI_RUKH_MASLAKI_MIZAJ.jpg',
  'Falkiyat': 'https://besturdubooks.net/wp-content/uploads/2018/10/Dars-e-Falkeyat.jpg',
  'Diwan al Hamasa': 'https://besturdubooks.net/wp-content/uploads/2022/08/Dewan-Ul-Hamasa.jpg',
  'Matn al Kafi': 'https://besturdubooks.net/wp-content/uploads/2018/10/sharh-urdu-matn-ul-kafi1.jpg',
};

async function restoreCovers() {
  console.log('Restoring commentary covers from original scrape...\n');

  const { data: books } = await supabase.from('Books')
    .select('id, title, sub_category')
    .eq('category', CATEGORY);

  let fixed = 0;
  let skipped = 0;

  for (const book of books) {
    const dbTitle = book.title.trim();

    if (book.sub_category === 'درسی کتب') {
      // For textbooks, use our verified textbook covers
      const matchKey = Object.keys(textbookCovers).find(k => dbTitle.toLowerCase().includes(k.toLowerCase()));
      if (matchKey) {
        const cover = textbookCovers[matchKey];
        await supabase.from('Books').update({ cover_url: cover }).eq('id', book.id);
        console.log(`[TEXTBOOK] ✅ ${dbTitle.substring(0,50)} → ${matchKey}`);
        fixed++;
      }
      continue;
    }

    // For commentaries: find the best matching original scraped cover
    // Try exact match first
    if (scrapedMap[dbTitle]) {
      await supabase.from('Books').update({ cover_url: scrapedMap[dbTitle] }).eq('id', book.id);
      console.log(`[SHARH] ✅ Exact match: ${dbTitle.substring(0,50)}`);
      fixed++;
      continue;
    }

    // Try partial match - find scraped book whose title closely overlaps
    let bestScore = 0;
    let bestCover = null;
    const dbWords = dbTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    for (const [sTitle, sCover] of Object.entries(scrapedMap)) {
      const sWords = sTitle.toLowerCase().split(/\s+/);
      const matches = dbWords.filter(w => sWords.some(sw => sw.includes(w) || w.includes(sw)));
      const score = matches.length / Math.max(dbWords.length, 1);
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestCover = sCover;
      }
    }

    if (bestCover) {
      await supabase.from('Books').update({ cover_url: bestCover }).eq('id', book.id);
      console.log(`[SHARH] ✅ Partial match (${Math.round(bestScore*100)}%): ${dbTitle.substring(0,50)}`);
      fixed++;
    } else {
      console.log(`[SHARH] ⚠️ No match found: ${dbTitle.substring(0,50)}`);
      skipped++;
    }
  }

  console.log(`\nDone! Fixed: ${fixed}, Skipped: ${skipped}`);
}

restoreCovers();
