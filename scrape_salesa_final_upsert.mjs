import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-salesa-3rd-year/';
const totalPages = 9;
const CATEGORY = 'درجہ ثالثہ';

// ─── Syllabus textbook keywords ───────────────────────────────────
// 1. ترجمہ و تفسیر از سورہ عنکبوت تا پارہ عم
// 2. ریاض الصالحین از کتاب الادب تا اختتام کتاب آداب السفر
// 3. مختصر القدوری از کتاب البیوع تا آخر...
// 4. اصول الشاشی ، مبادی الاصول (مولانا سعید احمد پالنپوری)
// 5. کافیہ
// 6. شرح تہذیب
// 7. متن عقیدۃ الطحاویہ
// 8. نفعۃ العرب ، معلم الانشاء جزء ثانی
// 9. حفظ احادیث ریاض الصالحین
const DARSI_KEYWORDS = [
  'عنکبوت', 'ankabut', 'ankaboot', 'ترجمہ پارہ', // Tafseer
  'ریاض الصالحین', 'riaz us saleheen', 'riyad us salihin', 'riyadh', 'riaz-us-saleheen', 'riaz', // Hadith
  'مختصر القدوری', 'mukhtasar ul quduri', 'mukhtasar al quduri', 'القدوری مع', 'quduri ma', // Fiqh
  'اصول الشاشی', 'usool us shashi', 'usool e shashi', 'usool -al- shashi', 'usool-al-shashi', 'mabadi al usool', 'مبادی الاصول', 'mabadiul usool', // Usool Fiqh
  'کافیہ', 'kafiya', 'kafia', // Nahw
  'شرح تہذیب', 'sharh tahzeeb', 'sharah tehzeeb', // Mantiq (Even though it has Sharh, it is the textbook!)
  'عقیدۃ الطحاویہ', 'aqeedah tahawiyyah', 'aqeedat ut tahawia', 'عقیدہ طحاویہ', // Aqeedah
  'نفعۃ العرب', 'nafhat ul arab', 'nafhat-ul-arab', 'معلم الانشاء', 'moalim ul insha', 'mualim ul insha', 'muallim', // Adab
];

// These words in title indicate commentary (not textbook)
const COMMENTARY_MARKERS = [
  'شرح', 'شروح', 'sharh ', 'sharah', ' sharh', 'حاشیہ', 'hashiya',
  'تشریح', 'tashrih', 'تقریر', 'آسان', 'asaan ', ' asan ', 'اردو شرح',
  'تبیین', 'tabyin', 'حل ', 'النور', 'اشراق', 'الخیر', 'فیض',
  'مسائل', ' msail', 'الجوہرة', 'امداد', 'imdad', 'الحل',
  'توضیح', 'تسہیل', 'تسهيل', 'tasheel', 'المرام', 'al maram', 'الفہم',
  'al fahm', 'بصیرت', 'تفہیم', 'tafheem',
];

function classifyBook(title) {
  const t = (title || '').toLowerCase();
  
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  if (isDarsi) {
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    
    // Exception: شرح تہذیب IS the textbook itself
    const isCoreBookException = 
      t.includes('شرح تہذیب') || t.includes('sharh tahzeeb') || t.includes('sharah tehzeeb') ||
      t.includes('معلم الانشاء') || t.includes('insha') ||
      t.includes('نفعۃ العرب') || t.includes('nafhat');
      
    if (hasCommentaryMarker && !isCoreBookException) {
      if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    
    // Core book with a distinct Sharh like "Hashiya Sharh Tahzeeb" or "Tafheem Sharh Tahzeeb"
    if (hasCommentaryMarker && isCoreBookException) {
      // If it has *other* commentary markers around the core book
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
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' },
        timeout: 20000
      });
      const $ = cheerio.load(res.data);
      const content = $('.entry-content');

      const images = content.find('img');
      console.log(`  Images found: ${images.length}`);
      
      images.each((i, imgEl) => {
        const img = $(imgEl);
        
        let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src') || '';
        
        if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('besturdubooks-net.png') || coverUrl.includes('placeholder') || coverUrl.includes('icon') || coverUrl.length < 20) return;
        
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

  fs.writeFileSync('salesa_final_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  console.log(`\n✅ SCRAPING COMPLETE! Total books: ${allBooks.length}`);
}

async function uploadToDB() {
   const dataPath = 'salesa_final_books.json';
   if (!fs.existsSync(dataPath)) {
      console.log('No data found to upload!');
      return;
   }
   
   const books = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
   console.log(`Uploading ${books.length} books to Supabase for ${CATEGORY}`);

   const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

   // Pre-clear old 3rd year books just to be safe and clean
   const { error: delError } = await supabase.from('Books').delete().eq('category', CATEGORY);
   if (delError) {
      console.log('Error clearing old 3rd year books:', delError.message);
   } else {
      console.log(`Wiped previous books for ${CATEGORY} to have a clean upload`);
   }
   
   let uploaded = 0;
   let skipped = 0;

   for (const book of books) {
      try {
         // Create a synthetic unique pdf_url to bypass Supabase's global unique constraint 
         // which frequently causes legitimate variations to be dropped
         let primary_url = book.pdf_url || (book.volumes[0] && book.volumes[0].url) || '';
         if (primary_url) primary_url += '#hash=' + Math.random().toString(36).substring(7);

         const dbBook = {
            title: book.title,
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
