import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/';
const totalPages = 14;
const CATEGORY = 'درجہ سادسہ';

// ─── Syllabus textbook keywords for 6th Year ──────────────────────
const DARSI_KEYWORDS = [
  'جلالین', 'jalalain', 'jalalayn', // Tafseer Jalalain
  'الفوز الکبیر', 'al fozul kabeer', 'al fauzul kabeer', 'fauz ul kabeer', // Usool Tafseer
  'خیر الاصول', 'khair ul usool', 'khair-ul-usool', // Usool Hadith
  'سراجی', 'siraji', 'sirajee', // Faraiz
  'کتاب الآثار', 'kitab ul athar', 'kitab ul asar', 'kitab-ul-athar', // Hadith
  'ہدایہ', 'hidayah', 'hedaya', 'hidaya', 'hidaaya', // Fiqh
  'توضیح', 'tauzeeh', 'tozeeh', 'tauzih', // Usool Fiqh - Tauzeeh Mukammal
  'شرح عقائد', 'sharh aqaid', 'sharh aqaed', 'sharh e aqaid', // Aqaid - Sharh Aqaid
  'علماء دیوبند کا دینی رخ', 'ulama e deoband', 'مسلکی مزاج', // Aqaid
  'درس فلکیات', 'dars falkiyat', 'dars e falkiyat', // Falkiyat
  'دیوان الحماسہ', 'diwan ul hamasa', 'diwan e hamasa', 'diwan al hamasa', 'حماسہ', // Lughah
  'متن الکافی', 'matn ul kafi', 'matn al kafi', 'کافی' // Lughah
];

// Words indicating commentary
const COMMENTARY_MARKERS = [
  'شرح', 'شروح', 'sharh ', 'sharah', ' sharh', 'حاشیہ', 'hashiya', 'hashia',
  'تشریح', 'tashrih', 'تقریر', 'آسان', 'asaan ', ' asan ', 'اردو شرح', 'عربی شرح',
  'تبیین', 'tabyin', 'حل ', 'النور', 'اشراق', 'الخیر', 'فیض', 'نور',
  'مسائل', ' msail', 'الجوہرة', 'امداد', 'imdad', 'الحل', 'هدايه', 'هدایہ',
  'توضیح', 'تسہیل', 'تسهيل', 'tasheel', 'المرام', 'al maram', 'الفہم', 'توضیحات',
  'al fahm', 'بصیرت', 'تفہیم', 'tafheem', 'کشف', 'kashaf', 'انوار', 'anwar',
  'اشرف الہدایہ', 'ashraf ul hidaya', 'ashraf-ul-hidayah', 'عین الہدایہ', 'ain ul hidaya',
  'احسن الہدایہ', 'ahsan ul hidaya', 'جمال الہدایہ', 'ثمر الہدایہ', 'کمالین', 'kamalain',
  'حواشی', 'hawashi', 'جمالین', 'jamalain', 'عنایات', 'inayat', 'تحفہ', 'tohfa'
];

function classifyBook(title) {
  const t = (title || '').toLowerCase();
  
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  if (isDarsi) {
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    
    // exceptionally "Sharh Aqaid" and "Tauzeeh" are textbooks
    let isCoreBookException = t.includes('شرح عقائد') || t.includes('sharh aqaid') || t.includes('sharh e aqaid') || 
                              (t.includes('توضیح') && !t.includes('توضیحات') && !t.includes('توضیح التہذیب'));

    // Special case for 'Tauzeeh' (it shouldn't match commentaries that have 'Tauzeeh' as translation word)
    if (t.includes('توضیح') && (t.includes('شرح') || t.includes('اردو') || t.includes('عربی'))) {
         isCoreBookException = false;
    }

    if (hasCommentaryMarker && !isCoreBookException) {
      if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    
    if (hasCommentaryMarker && isCoreBookException) {
      const otherMarkers = ['اردو', 'حاشیہ', 'تسهيل', 'تسہیل', 'تقریر', 'آسان', 'urdu', 'arabic', 'عربی', 'حواشی', 'اردو شرح', 'عربی شرح', 'عنایات', 'حل '];
      if (otherMarkers.some(kw => t.includes(kw.toLowerCase()))) {
         if (t.includes('عربی') || t.includes('arabic')) return 'عربی شروحات';
         return 'اردو شروحات';
      }
      return 'درسی کتب'; // Exactly "Sharh Aqaid" or "Tauzeeh"
    }

    return 'درسی کتب';
  }
  
  if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) return 'عربی شروحات';
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
          title = title.replace(/Download Link \d+/gi, '').replace(/^\d+\.\s*/, '').replace(/\[Arabic\]/i, '').replace(/\[Urdu\]/i, '').trim();
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

  // Cover fixing: for any core books that got archive pillar covers, assign related sharah covers. And handle missing texts.
  const essentialCoreBooks = [
    {
       title: 'Tafseer e Jalalain تفسیر جلالین',
       pdf_url: 'https://archive.org/download/TafseerJalalainFihrist/TafseerJalalain.pdf',
       cover_url: 'https://archive.org/services/img/TafseerJalalainFihrist',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/TafseerJalalainFihrist/TafseerJalalain.pdf'}],
       keywordMatch: 'jalalain'
    },
    {
       title: 'Al Fauzul Kabeer الفوز الکبیر فی اصول التفسیر',
       pdf_url: 'https://archive.org/download/AlFaoozUlKabeer/Al_Faooz_Ul_Kabeer.pdf',
       cover_url: 'https://archive.org/services/img/AlFaoozUlKabeer',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/AlFaoozUlKabeer/Al_Faooz_Ul_Kabeer.pdf'}],
       keywordMatch: 'kabeer'
    },
    {
       title: 'Khair ul Usool خیر الاصول',
       pdf_url: 'https://archive.org/download/KhairUlUsoolBushra/KhairUlUsoolBushra.pdf',
       cover_url: 'https://archive.org/services/img/KhairUlUsoolBushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/KhairUlUsoolBushra/KhairUlUsoolBushra.pdf'}],
       keywordMatch: 'khair ul usool'
    },
    {
       title: 'Siraji سراجی',
       pdf_url: 'https://archive.org/download/SirajiFiAlMeerasBushra/Siraji.pdf',
       cover_url: 'https://archive.org/services/img/SirajiFiAlMeerasBushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/SirajiFiAlMeerasBushra/Siraji.pdf'}],
       keywordMatch: 'siraji'
    },
    {
       title: 'Kitab ul Aasar کتاب الآثار امام محمد',
       pdf_url: 'https://archive.org/download/Kitab-ul-Asar-Maktaba-Al-Bushra/Kitab-ul-Asar%20MaktabatulBushra.pdf',
       cover_url: 'https://archive.org/services/img/Kitab-ul-Asar-Maktaba-Al-Bushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/Kitab-ul-Asar-Maktaba-Al-Bushra/Kitab-ul-Asar%20MaktabatulBushra.pdf'}],
       keywordMatch: 'asar'
    },
    {
       title: 'Al Hidayah Vol 2 (الہدایہ جلد ۲)',
       pdf_url: 'https://archive.org/download/HidayahBushar1To4/Hidayah%20Bushra%20Vol2.pdf',
       cover_url: 'https://archive.org/services/img/HidayahBushar1To4',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Volume 2', 'url': 'https://archive.org/download/HidayahBushar1To4/Hidayah%20Bushra%20Vol2.pdf'}],
       keywordMatch: 'hidaya'
    },
    {
       title: 'Tauzeeh Mukammal توضیح مکمل',
       pdf_url: 'https://archive.org/download/TanqeehUTauzeehBushra/Tanqeeh%20u%20tauzeeh%20bushra.pdf',
       cover_url: 'https://archive.org/services/img/TanqeehUTauzeehBushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/TanqeehUTauzeehBushra/Tanqeeh%20u%20tauzeeh%20bushra.pdf'}],
       keywordMatch: 'tauzeeh'
    },
    {
       title: 'Sharh Aqaid شرح عقائد',
       pdf_url: 'https://archive.org/download/Sharh-ul-Aqaid-MaktabulBushra/Sharhe%20Aqaid.pdf',
       cover_url: 'https://archive.org/services/img/Sharh-ul-Aqaid-MaktabulBushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/Sharh-ul-Aqaid-MaktabulBushra/Sharhe%20Aqaid.pdf'}],
       keywordMatch: 'sharh aqaid'
    },
    {
       title: 'Ulama e Deoband Ka Deeni Rukh علماء دیوبند کا دینی رخ',
       pdf_url: 'https://archive.org/download/UlemaEDeobandKaDeeniRukhAurMaslakiMizaje/Ulema%20e%20deoband%20ka%20deeni%20rukh%20aur%20maslaki%20mizaj.pdf',
       cover_url: 'https://archive.org/services/img/UlemaEDeobandKaDeeniRukhAurMaslakiMizaje',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/UlemaEDeobandKaDeeniRukhAurMaslakiMizaje/Ulema%20e%20deoband%20ka%20deeni%20rukh%20aur%20maslaki%20mizaj.pdf'}],
       keywordMatch: 'deoband'
    },
    {
       title: 'Dars e Falkiyat درس فلکیات',
       pdf_url: 'https://archive.org/download/DarsEFalkeyat/Dars-e-Falkeyat.pdf',
       cover_url: 'https://archive.org/services/img/DarsEFalkeyat',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/DarsEFalkeyat/Dars-e-Falkeyat.pdf'}],
       keywordMatch: 'falkiyat'
    },
    {
       title: 'Diwan al Hamasa دیوان الحماسہ',
       pdf_url: 'https://archive.org/download/Deewan-e-Hamasa-Bushra/Deewan-e-Hamasa-Bushra.pdf',
       cover_url: 'https://archive.org/services/img/Deewan-e-Hamasa-Bushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/Deewan-e-Hamasa-Bushra/Deewan-e-Hamasa-Bushra.pdf'}],
       keywordMatch: 'hamasa'
    },
    {
       title: 'Matn al Kafi متن الکافی',
       pdf_url: 'https://archive.org/download/MatnAlKafy-AlBushra/Matn%20al-Kafy%20-%20Al%20Bushra.pdf',
       cover_url: 'https://archive.org/services/img/MatnAlKafy-AlBushra',
       sub_category: 'درسی کتب',
       volumes: [{'title': 'Download PDF', 'url': 'https://archive.org/download/MatnAlKafy-AlBushra/Matn%20al-Kafy%20-%20Al%20Bushra.pdf'}],
       keywordMatch: 'kafi'
    }
  ];

  for (const b of essentialCoreBooks) {
    const isPresentAsTextbook = allBooks.some(x => x.sub_category === 'درسی کتب' && x.title.toLowerCase().includes(b.keywordMatch.toLowerCase()));
    if (!isPresentAsTextbook) {
      allBooks.push({
         title: b.title,
         pdf_url: b.pdf_url,
         cover_url: b.cover_url,
         sub_category: b.sub_category,
         category: CATEGORY,
         volumes: b.volumes
      });
      console.log('  ⚠️ Included missing generic core book: ' + b.title);
    }
  }

  // Find better covers for archive.org placeholder covers
  console.log('\nAssigning attractive covers using commentaries...');
  allBooks.filter(x => x.sub_category === 'درسی کتب').forEach(core => {
     if (core.cover_url.includes('archive.org')) {
        let sharh = allBooks.find(s => s.sub_category !== 'درسی کتب' && s.title.toLowerCase().includes(core.title.split(' ')[0].toLowerCase()) && !s.cover_url.includes('archive.org'));
        if (!sharh && core.title.includes('Hamasa')) sharh = allBooks.find(s => s.title.includes('حماسہ'));
        if (!sharh && core.title.includes('Aqaid')) sharh = allBooks.find(s => s.title.includes('عقائد'));
        if (!sharh && core.title.includes('Khair ul Usool')) sharh = allBooks.find(s => s.title.includes('خیر'));
        if (!sharh && core.title.includes('Kabeer')) sharh = allBooks.find(s => s.title.includes('الفوز'));
        if (!sharh && core.title.includes('Jalalain')) sharh = allBooks.find(s => s.title.includes('جلالین'));
        
        if (sharh) {
           core.cover_url = sharh.cover_url;
        }
     }
  });

  fs.writeFileSync('sadesa_final_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  console.log(`\n✅ SCRAPING COMPLETE! Total books: ${allBooks.length}`);
}

async function uploadToDB() {
   const dataPath = 'sadesa_final_books.json';
   if (!fs.existsSync(dataPath)) {
      console.log('No data found to upload!');
      return;
   }
   
   const books = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
   console.log(`Uploading ${books.length} books to Supabase for ${CATEGORY}`);

   const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
   const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

   const { error: delError } = await supabase.from('Books').delete().eq('category', CATEGORY);
   if (delError) {
      console.log('Error clearing old 6th year books:', delError.message);
   } else {
      console.log(`Wiped previous books for ${CATEGORY} to have a clean upload`);
   }
   
   let uploaded = 0;
   let skipped = 0;

   // Handle duplicate titles
   const titlesSeen = new Set();

   for (const book of books) {
      try {
         let primary_url = book.pdf_url || (book.volumes[0] && book.volumes[0].url) || '';
         if (primary_url) primary_url += '#hash=' + Math.random().toString(36).substring(7);

         let uniqueTitle = book.title.trim();
         while(titlesSeen.has(uniqueTitle)) {
             uniqueTitle += ' ';
         }
         titlesSeen.add(uniqueTitle);

         const dbBook = {
            title: uniqueTitle,
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
