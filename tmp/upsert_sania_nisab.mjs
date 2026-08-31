import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const textbookKeywords = [
  'Duroos ul Quran', 'Tafseer Para Amm', 'Para Amm', 
  'Fawaid Makkiya', 'Fuwaid-e-Makkiyya',
  'Zad ul Talibeen', 'Zaadut Talebeen',
  'Al Qira-at ur Rashida', 'Al Qiraat ur Rashida',
  'Moalim ul Insha', 'Muallim ul Insha',
  'Mukhtasar ul Qudori', 'Mukhtasar al Qudori',
  'Ilm us Seegha', 'Ilm us Seeghah',
  'Hidayat un Nahw', 'Hidayatun Nahw',
  'Taisir ul Mantiq', 'Mirqat'
];

const commentaryKeywords = [
  'Sharh', 'Sharah', 'Shuroohat', 'Shuroohaat', 'Tasheel', 'Tashrih', 'Tashreeh',
  'Hall', 'Solve', 'Key Book', 'Takmeel', 'Taozih', 'Tauzeeh', 'Explanation',
  'Dars e', 'Duroos', 'Miftah', 'Misbah', 'Inam ul', 'Khulasat'
];

async function upsertSaniaNisab() {
  const data = JSON.parse(readFileSync('tmp/sania_full_data.json', 'utf8'));
  const category = 'درجہ ثانیہ';
  
  console.log(`Re-uploading ${data.length} books for ${category} with strict Nisab rules...`);

  for (const book of data) {
    const title = book.title.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
    const pdf_url = book.links[0];
    const lowerTitle = title.toLowerCase();
    
    // Default sub_category
    let sub_category = 'اردو شروحات';
    
    // 1. Check if it's a commentary first
    const isCommentary = commentaryKeywords.some(kw => lowerTitle.includes(kw.toLowerCase()));
    
    // 2. Check if it's a core textbook
    const isTextbook = textbookKeywords.some(kw => lowerTitle.includes(kw.toLowerCase())) && !isCommentary;

    if (isTextbook) {
      sub_category = 'درسی کتب';
    } else if (isCommentary) {
       if (lowerTitle.includes('arabic') || lowerTitle.includes('arabi')) {
         sub_category = 'عربی شروحات';
       } else {
         sub_category = 'اردو شروحات';
       }
    } else {
      // If it doesn't match textbooks but isn't explicitly a sharh, it's likely a sharh/supplementary
      sub_category = 'اردو شروحات';
    }

    // Special cases: If it doesn't mention "Arabic" but title is in Arabic/from Al-Bushra, 
    // it's often counted as textbook IF it's not a sharh.
    // But we follow the strict list from the user's image.

    const description = book.links.length > 1 
      ? JSON.stringify(book.links)
      : `Download this book.`;

    const bookPayload = {
      title: title,
      author: 'BestUrduBooks',
      category: category,
      sub_category: sub_category,
      cover_url: book.image,
      pdf_url: pdf_url,
      description: description,
      size_mb: 20,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0
    };

    const { error } = await supabase.from('Books').insert([bookPayload]);
    if (error) console.error(`  [Error] ${title}:`, error.message);
    else console.log(`[OK] ${sub_category} -> ${title}`);
  }

  console.log('\nSUCCESS: 2nd Year Catalog is updated according to the Nisab image!');
}

upsertSaniaNisab().catch(console.error);
