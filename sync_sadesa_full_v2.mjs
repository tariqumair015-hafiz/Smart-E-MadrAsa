import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/';
const totalPages = 14;
const CATEGORY = 'درجہ سادسہ';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const syllabus = [
  {
    title: 'Tafseer e Jalalain تفسیر جلالین',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tafseer-Ul-Jalalain.jpg',
    pdf: 'https://archive.org/download/TafseerJalalainFihrist/TafseerJalalain.pdf',
    vols: [{title: 'Download PDF', url: 'https://archive.org/download/TafseerJalalainFihrist/TafseerJalalain.pdf'}]
  },
  {
    title: 'Al Fauzul Kabeer الفوز الکبیر فی اصول التفسیر',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Fauzul-Kabeer.jpg',
    pdf: 'https://archive.org/download/AlFaoozUlKabeer/Al_Faooz_Ul_Kabeer.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/AlFaoozUlKabeer/Al_Faooz_Ul_Kabeer.pdf'}]
  },
  {
    title: 'Khair ul Usool خیر الاصول',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Khair-ul-Usool.jpg',
    pdf: 'https://archive.org/download/KhairUlUsoolBushra/KhairUlUsoolBushra.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/KhairUlUsoolBushra/KhairUlUsoolBushra.pdf'}]
  },
  {
    title: 'Al Siraji fil Miras السراجی فی المیراث',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/AlSirajiFilMeras.jpg',
    pdf: 'https://archive.org/download/SirajiFiAlMeerasBushra/Siraji.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/SirajiFiAlMeerasBushra/Siraji.pdf'}]
  },
  {
    title: 'Kitab ul Aasar کتاب الآثار امام محمد',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Kitab-ul-Asar.jpg',
    pdf: 'https://archive.org/download/Kitab-ul-Asar-Maktaba-Al-Bushra/Kitab-ul-Asar%20MaktabatulBushra.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/Kitab-ul-Asar-Maktaba-Al-Bushra/Kitab-ul-Asar%20MaktabatulBushra.pdf'}]
  },
  {
    title: 'Al Hidayah Vol 2 الہدایہ جلد ۲',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Hidayah.jpg',
    pdf: 'https://archive.org/download/HidayahBushar1To4/Hidayah%20Bushra%20Vol2.pdf',
    vols: [
        {title: 'Vol 2', url: 'https://archive.org/download/HidayahBushar1To4/Hidayah%20Bushra%20Vol2.pdf'},
        {title: 'Vol 3', url: 'https://archive.org/download/HidayahBushar1To4/Hidayah%20Bushra%20Vol3.pdf'}
    ]
  },
  {
    title: 'Tauzeeh Mukammal توضیح مکمل',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tanqeeh-u-Tauzeeh.jpg',
    pdf: 'https://archive.org/download/TanqeehUTauzeehBushra/Tanqeeh%20u%20tauzeeh%20bushra.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/TanqeehUTauzeehBushra/Tanqeeh%20u%20tauzeeh%20bushra.pdf'}]
  },
  {
    title: 'Sharh Aqaid شرح عقائد',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Sharh-ul-Aqaid.jpg',
    pdf: 'https://archive.org/download/Sharh-ul-Aqaid-MaktabulBushra/Sharhe%20Aqaid.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/Sharh-ul-Aqaid-MaktabulBushra/Sharhe%20Aqaid.pdf'}]
  },
  {
    title: 'Ulama e Deoband Ka Deeni Rukh علماء دیوبند کا دینی رخ',
    cover: 'https://besturdubooks.net/wp-content/uploads/2020/09/Ulema-e-Deoband-Ka-Deeni-Rukh-Aur-Maslaki-Mizaj.jpg',
    pdf: 'https://archive.org/download/UlemaEDeobandKaDeeniRukhAurMaslakiMizaje/Ulema%20e%20deoband%20ka%20deeni%20rukh%20aur%20maslaki%20mizaj.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/UlemaEDeobandKaDeeniRukhAurMaslakiMizaje/Ulema%20e%20deoband%20ka%20deeni%20rukh%20aur%20maslaki%20mizaj.pdf'}]
  },
  {
    title: 'Dars e Falkiyat درس فلکیات',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Dars-e-Falkeyat.jpg',
    pdf: 'https://archive.org/download/DarsEFalkeyat/Dars-e-Falkeyat.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/DarsEFalkeyat/Dars-e-Falkeyat.pdf'}]
  },
  {
    title: 'Diwan al Hamasa دیوان الحماسہ',
    cover: 'https://besturdubooks.net/wp-content/uploads/2013/09/diwan-ul-hamasa.jpg',
    pdf: 'https://archive.org/download/Deewan-e-Hamasa-Bushra/Deewan-e-Hamasa-Bushra.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/Deewan-e-Hamasa-Bushra/Deewan-e-Hamasa-Bushra.pdf'}]
  },
  {
    title: 'Matn al Kafi متن الکافی',
    cover: 'https://besturdubooks.net/wp-content/uploads/2013/09/matn-al-kafi.jpg',
    pdf: 'https://archive.org/download/MatnAlKafy-AlBushra/Matn%20al-Kafy%20-%20Al%20Bushra.pdf',
    vols: [{title: 'Link 1', url: 'https://archive.org/download/MatnAlKafy-AlBushra/Matn%20al-Kafy%20-%20Al%20Bushra.pdf'}]
  }
];

function cleanCover(url) {
  if (!url) return '';
  let cleaned = url;
  if (url.includes('i2.wp.com') || url.includes('i1.wp.com') || url.includes('i0.wp.com')) {
    cleaned = url.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
  }
  // This cleans both -200x300 and also -scaled which is becoming common on BestUrdu
  cleaned = cleaned.replace(/-[0-9]+x[0-9]+(?=\.(jpg|png|jpeg|webp))/i, '');
  cleaned = cleaned.replace(/-scaled(?=\.(jpg|png|jpeg|webp))/i, '');
  return cleaned;
}

async function run() {
  console.log('Starting full sync for 6th Year (Ultimate Correction)...');

  // STEP 1: Clear everything for this category
  const { error: delError } = await supabase.from('Books').delete().eq('category', CATEGORY);
  if (delError) {
    console.error('Failed to clear category', delError);
    return;
  }
  console.log('Category cleared.');

  // STEP 2: Scrape all 14 pages for EVERYTHING
  const allBooks = [];
  for (let page = 1; page <= totalPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
    console.log(`Scraping page ${page}: ${url}`);
    
    try {
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(res.data);
      const content = $('.entry-content');
      
      content.find('img').each((i, imgEl) => {
        const img = $(imgEl);
        let cover = img.attr('data-lazy-src') || img.attr('src') || '';
        cover = cleanCover(cover);
        
        if (!cover || cover.includes('logo') || cover.length < 20) return;

        // Extract title: it's usually before or after
        let title = '';
        let prev = img.parent().prev();
        let searchLimit = 0;
        while (prev.length && !title && searchLimit < 8) {
          const text = prev.text().trim();
          if (text && text.length > 5 && !text.match(/^\d+\.$/) && !text.toLowerCase().includes('click here')) {
            title = text;
          }
          prev = prev.prev();
          searchLimit++;
        }
        if (!title) title = img.attr('alt') || '';
        if (!title) return;

        // Volumes
        const volumes = [];
        let next = img.parent().next();
        let limit = 0;
        while (next.length && limit < 10) {
           if (next.find('img').length > 0 && limit > 0) break;
           next.find('a').each((j, linkEl) => {
             const link = $(linkEl);
             const href = link.attr('href') || '';
             const text = link.text().trim();
             if (href && (href.includes('archive.org/download') || href.includes('mediafire.com'))) {
               let volTitle = text || `Volume ${volumes.length + 1}`;
               if (!volumes.find(v => v.url === href)) {
                  volumes.push({ title: volTitle, url: href });
               }
             }
           });
           next = next.next();
           limit++;
        }

        if (title && volumes.length > 0) {
          // Clean title
          title = title.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          
          // Classify
          const isTextbook = syllabus.some(s => title.toLowerCase().includes(s.title.split(' ')[0].toLowerCase())) &&
                             !title.toLowerCase().includes('sharh') && 
                             !title.toLowerCase().includes('urdu') && 
                             !title.toLowerCase().includes('shurooh') &&
                             !title.toLowerCase().includes('teer') &&
                             !title.toLowerCase().includes('tozeeh-ut-tahzeeb'); // Exception

          let sub_category = isTextbook ? 'درسی کتب' : 'اردو شروحات';
          if (title.toLowerCase().includes('arabic') || title.toLowerCase().includes('عربی')) sub_category = 'عربی شروحات';

          allBooks.push({ title, cover, sub_category, volumes });
        }
      });
    } catch (e) {
      console.log(`Failed page ${page}`);
    }
  }

  // STEP 3: Manual injection for core textbooks if they weren't found nicely
  for (const s of syllabus) {
     const exists = allBooks.find(b => b.sub_category === 'درسی کتب' && b.title.includes(s.title.split(' ')[0]));
     if (!exists) {
        allBooks.push({
           title: s.title,
           cover: s.cover,
           sub_category: 'درسی کتب',
           volumes: s.vols
        });
        console.log(`Manually added missing core: ${s.title}`);
     } else {
        // FORCE the verified cover forcore textbooks in the list
        exists.cover = s.cover;
        console.log(`Forced cover for: ${exists.title}`);
     }
  }

  // STEP 4: FINAL UPLOAD
  const titlesSeen = new Set();
  let uploaded = 0;
  for (const b of allBooks) {
    let uTitle = b.title;
    while(titlesSeen.has(uTitle)) { uTitle += ' '; }
    titlesSeen.add(uTitle);

    const dbBook = {
      title: uTitle,
      author: 'BestUrduBooks',
      category: CATEGORY,
      sub_category: b.sub_category,
      cover_url: b.cover,
      pdf_url: b.volumes[0].url + '#hash=' + Math.random().toString(36).substring(7),
      description: JSON.stringify(b.volumes),
      size_mb: 15, is_free: true, downloads: 0, rating: 0, pages: 0
    };

    const { error } = await supabase.from('Books').insert([dbBook]);
    if (!error) uploaded++;
  }

  console.log(`UPLOADED: ${uploaded} books for 6th Year.`);
}

run();
