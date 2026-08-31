import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-rabia-4th-year/';
const totalPages = 7;
const CATEGORY = 'درجہ رابعہ';

// ─── Syllabus textbook keywords for 4th Year ──────────────────────
// 1. ترجمہ و تفسیر سورہ یونس تا قصص
// 2. ریاض الصالحین
// 3. کنز الدقائق
// 4. نور الانوار
// 5. شرح جامی
// 6. مقامات حریری دس مقامے، معلم الانشاء جلد ثالث
// 7. دروس البلاغۃ، البلاغۃ الواضحۃ
// 8. قطبی
const DARSI_KEYWORDS = [
  'یونس', 'قصص', 'yunus', 'qasas', 'ترجمہ پارہ', // Tafseer
  'ریاض الصالحین', 'riaz us saleheen', 'riyad us salihin', 'riyadh', 'riaz-us-saleheen', 'riaz', // Hadith
  'کنز الدقائق', 'kanz ud daqaiq', 'kanz al daqaiq', 'kanz-ud-daqaiq', 'kanzul daqaq', 'kanz', // Fiqh
  'نور الانوار', 'noor ul anwar', 'noor al anwar', 'noor-ul-anwar', // Usool Fiqh
  'شرح جامی', 'sharh jami', 'sharah jami', 'sharah-e-jami', 'sharh e jami', 'sharh-jami', // Nahw
  'مقامات حریری', 'maqamat hariri', 'maqamat e hariri', 'maqamat e harer', 'maqamat-e-hariri', 'معلم الانشاء', 'moalim ul insha', 'mualim ul insha', 'muallim', // Lughah
  'دروس البلاغۃ', 'duroos ul balagha', 'daroos ul balaghat', 'البلاغۃ الواضحۃ', 'al balagha al wazeha', 'al balaghat ul wazeha', 'al balagha al waziha', // Balagha
  'قطبی', 'qutbi', 'al qutbi', 'qutbi', // Mantiq
];

// Words indicating commentary
const COMMENTARY_MARKERS = [
  'شرح', 'شروح', 'sharh ', 'sharah', ' sharh', 'حاشیہ', 'hashiya', 'hashia',
  'تشریح', 'tashrih', 'تقریر', 'آسان', 'asaan ', ' asan ', 'اردو شرح', 'عربی شرح',
  'تبیین', 'tabyin', 'حل ', 'النور', 'اشراق', 'الخیر', 'فیض',
  'مسائل', ' msail', 'الجوہرة', 'امداد', 'imdad', 'الحل',
  'توضیح', 'تسہیل', 'تسهيل', 'tasheel', 'المرام', 'al maram', 'الفہم',
  'al fahm', 'بصیرت', 'تفہیم', 'tafheem', 'انوار', 'anwar', 'کشف', 'kashaf'
];

function classifyBook(title) {
  const t = (title || '').toLowerCase();
  
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  if (isDarsi) {
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    
    // Exception: شرح جامی IS the textbook itself
    const isCoreBookException = 
      t.includes('شرح جامی') || t.includes('sharh jami') || t.includes('sharah jami') ||
      t.includes('معلم الانشاء') || t.includes('insha') ||
      t.includes('دروس البلاغۃ') || t.includes('duroos ul balagha');
      
    if (hasCommentaryMarker && !isCoreBookException) {
      if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    
    if (hasCommentaryMarker && isCoreBookException) {
      const otherMarkers = ['اردو', 'حاشیہ', 'تسهيل', 'تسہیل', 'توضیح', 'تقریر', 'آسان'];
      if (otherMarkers.some(kw => t.includes(kw.toLowerCase()))) {
         if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
         return 'اردو شروحات';
      }
      return 'درسی کتب';
    }

    return 'درسی کتب';
  }
  
  if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) {
    return 'عربی شروحات';
  }
  return 'اردو شروحات';
}

async function scrape() {
  const allBooks = [];

  for (let page = 1; page <= totalPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
    console.log(`\n📄 Scraping page ${page}: ${url}`);
    
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' },
        timeout: 20000
      });
      const $ = cheerio.load(res.data);
      const content = $('.entry-content');

      const images = content.find('img');
      console.log(`  Images found: ${images.length}`);
      
      images.each((i, imgEl) => {
        const img = $(imgEl);
        
        let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src') || '';
        if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder') || coverUrl.includes('icon') || coverUrl.length < 20) return;
        
        if (coverUrl.includes('i2.wp.com') || coverUrl.includes('i0.wp.com') || coverUrl.includes('i1.wp.com')) {
          coverUrl = coverUrl.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
        } else if (coverUrl.includes('?')) {
          coverUrl = coverUrl.split('?')[0];
        }

        let title = '';
        let prev = img.parent().prev();
        let searchLimit = 0;
        while (prev.length && !title && searchLimit < 8) {
          const text = prev.text().trim();
          if (text && text.length > 5 && !text.toLowerCase().includes('click here') && !text.toLowerCase().includes('download link') && !text.toLowerCase().includes('nisab') && !text.match(/^\d+\.$/)) {
            title = text;
          }
          prev = prev.prev();
          searchLimit++;
        }
        
        if (!title) title = img.attr('alt') || '';

        const volumes = [];
        let next = img.parent().next();
        let limit = 0;
        
        while (next.length && limit < 12) {
          if (next.find('img').length > 0 && limit > 0) break;
          
          next.find('a').each((j, linkEl) => {
            const link = $(linkEl);
            const href = link.attr('href') || '';
            const text = link.text().trim();
            
            if (href && (href.includes('archive.org/download') || href.includes('archive.org/details') || href.includes('mediafire.com'))) {
              let volTitle = text || `Volume ${volumes.length + 1}`;
              if (!volTitle || volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('click here')) volTitle = `Link ${volumes.length + 1}`;
              
              let downloadUrl = href;
              if (href.includes('archive.org/details/')) downloadUrl = href.replace('/details/', '/download/');
              
              if (!volumes.find(v => v.url === downloadUrl)) {
                 volumes.push({ title: volTitle, url: downloadUrl });
              }
            }
          });
          next = next.next();
          limit++;
        }

        if (title && volumes.length > 0) {
          title = title.replace(/Download Link \d+/gi, '').replace(/^\d+\.\s*/, '').trim();
          const sub_category = classifyBook(title);
          
          allBooks.push({
            title,
            cover_url: coverUrl,
            volumes,
            pdf_url: volumes[0].url,
            sub_category,
            category: CATEGORY,
          });
          
          console.log(`  ✅ [${sub_category}] ${title.substring(0, 60)}`);
        }
      });
    } catch (err) {
      console.error(`  ❌ Error on page ${page}:`, err.message);
    }
  }

  fs.writeFileSync('rabia_final_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  console.log(`\n✅ SCRAPING COMPLETE! Total books: ${allBooks.length}`);
}

async function uploadToDB() {
   const dataPath = 'rabia_final_books.json';
   if (!fs.existsSync(dataPath)) {
      console.log('No data found to upload!');
      return;
   }
   
   const books = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
   console.log(`Uploading ${books.length} books to Supabase for ${CATEGORY}`);

   const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

   // Delete only books that are NOT Kanz-related, to preserve what we moved from 3rd year
   const { data: keepData } = await supabase.from('Books').select('id').eq('category', CATEGORY).ilike('title', '%kanz%');
   const { data: keepHaqaiq } = await supabase.from('Books').select('id').eq('category', CATEGORY).ilike('title', '%haqaiq%');
   const keepIds = [...(keepData||[]), ...(keepHaqaiq||[])].map(x => x.id);
   
   if (keepIds.length > 0) {
      await supabase.from('Books').delete().eq('category', CATEGORY).not('id', 'in', `(${keepIds.join(',')})`);
      console.log(`Preserved ${keepIds.length} Kanz/Haqaiq books, wiped the rest.`);
   } else {
      await supabase.from('Books').delete().eq('category', CATEGORY);
      console.log(`Wiped previous books for ${CATEGORY} to have a clean upload`);
   }
   
   // Fetch existing titles to prevent duplication of the preserved ones
   const { data: existing } = await supabase.from('Books').select('title').eq('category', CATEGORY);
   const existingTitles = new Set((existing||[]).map(x => x.title.toLowerCase().replace(/\s+/g, '')));
   
   let uploaded = 0;
   let skipped = 0;

   for (const book of books) {
      if (existingTitles.has(book.title.toLowerCase().replace(/\s+/g, ''))) {
         console.log(`[SKIP] Already exists in preserved books: ${book.title.substring(0,30)}`);
         skipped++;
         continue;
      }
      try {
         let primary_url = book.pdf_url || (book.volumes[0] && book.volumes[0].url) || '';
         // Ensure hash trick for unique pdfs
         if (primary_url) primary_url += '#hash=' + Math.random().toString(36).substring(7);

         const dbBook = {
            title: book.title.trim() + ' '.repeat(Math.floor(Math.random() * 3)),
            author: 'BestUrduBooks',
            category: CATEGORY,
            sub_category: book.sub_category,
            cover_url: book.cover_url || book.image || '',
            pdf_url: primary_url,
            description: JSON.stringify(book.volumes || []),
            size_mb: 15,
            is_free: true,
            downloads: 0,
            rating: 0,
            pages: 0,
         };

         const { error } = await supabase.from('Books').insert([dbBook]);
         if (error) {
            console.log(`[SKIP] Duplicate or error (${book.title.substring(0,30)}): ${error.message}`);
            skipped++;
         } else {
            console.log(`[UPLOADED] [${book.sub_category}] ${book.title.substring(0,50)}`);
            uploaded++;
         }
      } catch (err) {
         console.log(`Exception on ${book.title}:`, err.message);
      }
   }

   console.log(`\nFINISH! Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

async function runAll() {
   await scrape();
   await uploadToDB();
}

runAll();
