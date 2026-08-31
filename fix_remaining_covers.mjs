import { createClient } from '@supabase/supabase-js';
const s = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co','sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');

// Remaining 5 books with archive.org temple logos
// Now using ACTUAL cover image URLs extracted from listing pages
const FIXES = [
  { 
    match: 'Mishkat ul Masabih Rahmania', 
    cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Mishkar-al-Masabeeh-Rahmania.jpg'
  },
  { 
    match: 'Mishkat ul Masabeeh Urdu', 
    // No image found on listing pages for this one - use Rahmania cover as closest match
    cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/Mishkar-al-Masabeeh-Rahmania.jpg'
  },
  { 
    match: 'Nukhbatul Fikar', 
    cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/NUHBATUL-FIKAR-IMDAD-UN-NAZAR.jpg'
  },
  { 
    match: 'Nuzha tun Nazar', 
    cover: 'https://besturdubooks.net/wp-content/uploads/2025/03/Sharah_Nukhba_Tul_Fikr.jpg'
  },
  { 
    match: 'Taiseer e Mustalah', 
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/12/Taiseer-E-Mustalah-Ul-Hadith.jpg'
  },
  { 
    match: "Al Hai'at Ul Wusta", 
    cover: 'https://besturdubooks.net/wp-content/uploads/2020/04/al-haiat-ul-wusta.jpg'
  },
];

const {data: books} = await s.from('Books').select('id,title,cover_url').eq('category','درجہ سابعہ').eq('sub_category','درسی کتب');
console.log('Books found:', books.length);

for (const fix of FIXES) {
  const book = books.find(b => b.title.includes(fix.match));
  if (!book) { console.log('NOT FOUND:', fix.match); continue; }
  const {error} = await s.from('Books').update({cover_url: fix.cover}).eq('id', book.id);
  if (error) console.log('ERROR:', fix.match, error.message);
  else console.log('UPDATED:', fix.match, '->', fix.cover.split('/').pop());
}
console.log('All done!');
