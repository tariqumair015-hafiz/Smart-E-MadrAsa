/**
 * Upload script for Dars-e-Nizami 2nd Year
 * Uses already-scraped sania_books.json data but with:
 * - Fixed category: 'درجہ ثانیہ (2nd Year)'
 * - Improved syllabus-based sub_category classification
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY = 'درجہ ثانیہ (2nd Year)';

// ─── Syllabus: Official 2nd Year textbook keywords ───────────────
const DARSI_KEYWORDS = [
  'پارہ عم', 'para aam', 'para amm', 'ترجمہ پارہ', 'tarjuma para',
  'کشف الغم', 'kashful gham',  // Tafsir Para Aam = textbook
  'فوائد مکیہ', 'fawaid makkiya',
  'زاد الطالبین', 'zad ul talibeen', 'zad al talibeen', 'zaad ul talibeen', 'zaad',
  'القراءة الراشدة', 'القراءة الراشدہ', 'qiraat ur rashida', 'qiraat al rashida', 'al qiraat al rashidah', 'rashidah',
  'معلم الانشاء', 'moalim ul insha', 'mualim ul insha', 'muallim ul insha', 'muallim al insha',
  'هداية النحو', 'ہدایۃ النحو', 'hidayatun nahw', 'hidayat un nahw', 'hidaya al nahw', 'hidayat',
  'علم الصيغة', 'علم الصیغہ', 'ilm us seegh', 'ilm al siga',
  'خاصیات ابواب', 'khasiyat abwab', 'khasiyaat abwab', 'darsi taqreer khasiaat', 'darsi taqreer khasi',
  'تیسیر المنطق', 'تيسير المنطق', 'tayseer ul mantiq', 'taiseer ul mantiq', 'taisir ul mantiq',
  'مرقاة', 'مرقات', 'mirqat', 'mirqaat', 'dars e mirqat', 'dars-e-mirqat',
  'مختصر القدوری', 'mukhtasar ul quduri', 'mukhtasar al quduri', 'al quduri maa',
  'القدوری مع', 'quduri ma', 'afzal al tatbeeq', 'افضل التطبیق', 'al qawlul mukhtar', 'القول المختار',
];

// Words that clearly mean commentary (not original text)
const COMMENTARY_MARKERS = [
  'شرح ', ' شرح', 'اردو شرح', 'عربی شرح',
  'sharh ', ' sharh', 'sharah', 'تشریح', 'آسان', 'asaan', 'asan',
  'تبیین', 'tabyin', 'الحل ', ' الحل', 'al hall',
  'اشراق', 'خیر النحو', 'khair un nahw', 'tashrihat', 'تشریحات',
  'imdad', 'امداد', 'الجوہرة', 'jawahir',
  'musahhil', 'مسہل', 'shazaraat', 'شذرات',
];

function classifyBook(title) {
  const t = (title || '').toLowerCase();
  
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  if (isDarsi) {
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    if (hasCommentaryMarker) {
      // Exception: Zad ul Talibeen IS the official textbook
      if (t.includes('زاد الطالبین') || t.includes('zad') || t.includes('zaad')) return 'درسی کتب';
      // Exception: Al Qiraat ur Rashida itself
      if (t.includes('قراءة الراشد') || t.includes('rashid')) return 'درسی کتب';
      // Otherwise it's a commentary of the textbook
      if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    return 'درسی کتب';
  }
  
  if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) return 'عربی شروحات';
  return 'اردو شروحات';
}

// Load books from our scraped JSON files (both old and new)
let rawBooks = [];

// Load the existing sania_books.json (working data from before)
if (fs.existsSync('sania_books.json')) {
  const oldData = JSON.parse(fs.readFileSync('sania_books.json', 'utf8'));
  rawBooks.push(...oldData);
  console.log(`Loaded ${oldData.length} books from sania_books.json`);
}

// Also load sania_final_books.json if it exists and has new books
if (fs.existsSync('sania_final_books.json')) {
  const newData = JSON.parse(fs.readFileSync('sania_final_books.json', 'utf8'));
  rawBooks.push(...newData);
  console.log(`Loaded ${newData.length} books from sania_final_books.json`);
}

// Deduplicate by title
const seen = new Set();
const books = rawBooks.filter(b => {
  const key = (b.title || '').trim().substring(0, 50);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`Total unique books to upload: ${books.length}`);

// Reclassify each book with our improved logic
const processedBooks = books.map(b => ({
  title: b.title,
  author: b.author || 'BestUrduBooks',
  category: CATEGORY,
  sub_category: classifyBook(b.title),
  cover_url: b.cover_url || '',
  pdf_url: b.pdf_url || '',
  description: JSON.stringify(b.volumes || []),
  size_mb: 15,
  is_free: true,
  downloads: 0,
  rating: 0,
  pages: 0,
}));

const textbooks = processedBooks.filter(b => b.sub_category === 'درسی کتب');
const urduSharah = processedBooks.filter(b => b.sub_category === 'اردو شروحات');
const arabicSharah = processedBooks.filter(b => b.sub_category === 'عربی شروحات');

console.log(`\nClassification breakdown:`);
console.log(`  درسی کتب: ${textbooks.length}`);
console.log(`  اردو شروحات: ${urduSharah.length}`);
console.log(`  عربی شروحات: ${arabicSharah.length}`);
console.log(`\nTextbook titles:`);
textbooks.forEach(b => console.log('  [T]', b.title.substring(0, 60)));

async function upload() {
  let uploaded = 0, updated = 0, skipped = 0;

  for (const book of processedBooks) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('Books')
        .select('id')
        .eq('title', book.title)
        .eq('category', CATEGORY)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('Books')
          .update({ 
            cover_url: book.cover_url,
            pdf_url: book.pdf_url,
            description: book.description,
            sub_category: book.sub_category,
          })
          .eq('id', existing.id);
        if (error) { console.error(`Update error ${book.title}:`, error.message); skipped++; }
        else { console.log(`Updated [${book.sub_category}]: ${book.title.substring(0, 50)}`); updated++; }
      } else {
        // Check duplicate pdf_url
        if (book.pdf_url) {
          const { data: dupPdf } = await supabase.from('Books').select('id').eq('pdf_url', book.pdf_url).maybeSingle();
          if (dupPdf) { console.log(`Skip duplicate PDF: ${book.title.substring(0, 40)}`); skipped++; continue; }
        }
        const { error } = await supabase.from('Books').insert([book]);
        if (error) { console.error(`Insert error ${book.title}:`, error.message); skipped++; }
        else { console.log(`Inserted [${book.sub_category}]: ${book.title.substring(0, 50)}`); uploaded++; }
      }
    } catch (e) {
      console.error(`Error for ${book.title}:`, e.message);
      skipped++;
    }
  }

  console.log(`\n✅ UPLOAD COMPLETE!`);
  console.log(`   Inserted: ${uploaded}`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped}`);
}

upload();
