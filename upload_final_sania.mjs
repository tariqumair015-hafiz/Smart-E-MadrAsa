import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY = 'درجہ ثانیہ (2nd Year)';

// The exact syllabus strings matching Wifaq ul Madaris
const DARSI_KEYWORDS = [
  'پارہ عم', 'para aam', 'para amm', 'ترجمہ پارہ', // Tarjuma & Hifz 
  'فوائد مکیہ', 'fawaid makkiya', // Tajweed
  'زاد الطالبین', 'zad ul talibeen', 'zad al talibeen', 'zaad', // Hadith
  'القراءة الراشدة', 'القراءة الراشدہ', 'qiraat ur rashida', 'qiraat al rashida', // Arabic Lit 1
  'معلم الانشاء', 'moalim ul insha', 'mualim ul insha', 'muallim', // Arabic Lit 2
  'مختصر القدوری', 'mukhtasar ul quduri', 'mukhtasar al quduri', 'القدوری مع', 'quduri ma', 'افضل التطبیق', 'القول المختار', // Fiqh
  'علم الصیغہ', 'علم الصيغة', 'ilm us seegh', 'ilm al siga', 'خاصیات ابواب', 'khasiyat abwab', 'khasiyaat abwab', // Sarf
  'هداية النحو', 'ہدایۃ النحو', 'hidayatun nahw', 'hidayat un nahw', 'hidaya al nahw', // Nahw
  'تیسیر المنطق', 'تيسير المنطق', 'tayseer ul mantiq', 'taiseer ul mantiq', 'taisir ul mantiq', // Mantiq 1
  'مرقاة', 'مرقات', 'mirqat', 'mirqaat', // Mantiq 2
];

// Markers that explicitly indicate commentary rather than the core textbook
const COMMENTARY_MARKERS = [
  'شرح', 'شروح', 'sharh', 'sharah', 'تشریح', 'آسان', 'asaan', 'asan', 'اردو شرح', 'عربی شرح',
  'تبیین', 'tabyin', 'الحل', 'al hall', 'اشراق', 'خیر النحو', 'khair un nahw', 'tashrihat', 'تشریحات',
  'امداد', 'imdad', 'الجوہرة', 'jawahir', 'مسہل', 'musahhil', 'شذرات', 'shazaraat', 'حاشیہ', 'hashiya',
  'توضیح', 'تقریر', 'تسہیل', 'تسهيل', 'tasheel',
];

function classifyBook(title) {
  const t = (title || '').toLowerCase();
  
  // Is there a Darsi match?
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  if (isDarsi) {
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    
    // Some core books sound like commentaries or share words. Protect them:
    const isCoreBookException = 
      t.includes('زاد الطالبین') || t.includes('zad') || t.includes('zaad') ||
      t.includes('قراءة الراشد') || t.includes('rashid') || t.includes('qiraat') ||
      t.includes('معلم الانشاء') || t.includes('insha') ||
      t.includes('علم الصیغہ') || t.includes('ilm us seegh');
      
    if (hasCommentaryMarker && !isCoreBookException) {
      // It's a commentary of a syllabus book
      if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    
    // Specific edge case: "Quduri Maa Ahadithiha" might have "مع" but is textbook edition
    if (hasCommentaryMarker && isCoreBookException) {
       // if we have 'sharh' explicitly in Zad ul talibeen, it's commentary
       if (t.includes('sharh') || t.includes('شرح')) {
           if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
           return 'اردو شروحات';
       }
       return 'درسی کتب';
    }

    return 'درسی کتب';
  }
  
  // If not Darsi specifically by name, classify arbitrarily based on Arabic flag
  if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) {
    return 'عربی شروحات';
  }
  return 'اردو شروحات';
}

async function run() {
  const dataPath = 'tmp/sania_full_data.json';
  if (!fs.existsSync(dataPath)) {
    console.error("Missing data file:", dataPath);
    return;
  }
  
  const rawBooks = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${rawBooks.length} books from ${dataPath}`);

  // Need format for DB containing 'volumes', 'sub_category', etc
  const processedBooks = rawBooks.map(b => {
    // If books saved format as { title, link1... }
    // The previously used `sania_full_data.json` had format:
    // { title, coverUrl, links: [{title, url}] } OR similar. Let's adapt.
    
    let volArr = b.volumes || b.links || [];
    let pdfUrl = b.pdf_url || '';
    if (!pdfUrl && volArr.length > 0) pdfUrl = volArr[0].url;
    
    return {
      title: b.title,
      author: b.author || 'BestUrduBooks',
      category: CATEGORY,
      sub_category: classifyBook(b.title),
      cover_url: b.cover_url || b.coverUrl || b.image || '',
      pdf_url: pdfUrl,
      description: JSON.stringify(volArr),
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0,
    };
  });

  const textbooks = processedBooks.filter(b => b.sub_category === 'درسی کتب');
  const urduSharah = processedBooks.filter(b => b.sub_category === 'اردو شروحات');
  const arabicSharah = processedBooks.filter(b => b.sub_category === 'عربی شروحات');

  console.log(`\nClassification Summary:`);
  console.log(`- درسی کتب: ${textbooks.length}`);
  console.log(`- اردو شروحات: ${urduSharah.length}`);
  console.log(`- عربی شروحات: ${arabicSharah.length}`);
  
  console.log('\nSample Textbooks:');
  textbooks.slice(0, 5).forEach(b => console.log('  ', b.title.substring(0,60)));
  
  let uploaded = 0, updated = 0, skipped = 0;

  for (const book of processedBooks) {
    try {
      if (!book.title) { skipped++; continue; }
      
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
        else { console.log(`[UDPATE] [${book.sub_category}] ${book.title.substring(0,40)}`); updated++; }
      } else {
        const { error } = await supabase.from('Books').insert([book]);
        if (error) { 
           if (error.code === '23505') { console.log(`[SKIP] Duplicate PDF: ${book.title.substring(0,40)}`); }
           else { console.error(`[INSERT ERROR] ${book.title}:`, error.message); }
           skipped++; 
        }
        else { console.log(`[INSERT] [${book.sub_category}] ${book.title.substring(0,40)}`); uploaded++; }
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

run();
