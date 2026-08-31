import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

// All scholars after Palanpuri that need re-scraping
const scholarsToScrape = [
  { 
    tag: "maulana-sarfaraz-khan-safdar-books", 
    subCat: "maulana-sarfaraz-safdar", 
    author: "Maulana Sarfaraz Khan Safdar",
    maxPages: 5
  },
  { 
    tag: "maulana-tariq-jameel-books", 
    subCat: "maulana-tariq-jameel", 
    author: "Maulana Tariq Jameel",
    maxPages: 3
  },
  { 
    tag: "maulana-zahid-ur-rashdi-books", 
    subCat: "maulana-zahid-ur-rashdi", 
    author: "Maulana Zahid Ur Rashdi",
    maxPages: 5
  },
  { 
    tag: "shaykh-ul-hadees-maulana-zakariya-books", 
    subCat: "maulana-zakariyya-kandhelvi", 
    author: "Maulana Zakariyya Kandhelvi",
    maxPages: 5
  },
  { 
    tag: "maulana-zulfiqar-ahmad-naqshbandi-books", 
    subCat: "maulana-zulfiqar-naqshbandi", 
    author: "Maulana Zulfiqar Ahmad Naqshbandi",
    maxPages: 8
  },
  { 
    tag: "mufti-abu-lubaba-shah-mansoor-books", 
    subCat: "mufti-abu-lubaba", 
    author: "Mufti Abu Lubaba Shah Mansoor",
    maxPages: 4
  },
  { 
    tag: "mufti-akhtar-imam-adil-qasmi-books", 
    subCat: "mufti-akhtar-imam-adil", 
    author: "Mufti Akhtar Imam Adil Qasmi",
    maxPages: 7
  },
  { 
    tag: "mufti-inam-ul-haq-qasmi-books", 
    subCat: "mufti-inam-ul-haq", 
    author: "Mufti Inam ul Haq Qasmi",
    maxPages: 4
  },
  { 
    tag: "mufti-muhammad-shafi-books", 
    subCat: "mufti-muhammad-shafi", 
    author: "Mufti Muhammad Shafi Usmani",
    maxPages: 5
  },
  { 
    tag: "mufti-muhammad-taqi-usmani-books", 
    subCat: "mufti-muhammad-taqi-usmani", 
    author: "Mufti Muhammad Taqi Usmani",
    maxPages: 10
  },
  { 
    tag: "mufti-muhammad-jafar-milly-books", 
    subCat: "mufti-jafar-milly", 
    author: "Mufti Muhammad Jafar Milly",
    maxPages: 3
  },
  { 
    tag: "mufti-rasheed-ahmad-ludhianvi-books", 
    subCat: "mufti-rasheed-ludhianvi", 
    author: "Mufti Rasheed Ahmad Ludhianvi",
    maxPages: 4
  },
  { 
    tag: "mufti-shoaibullah-khan-miftahi-books", 
    subCat: "mufti-shoaibullah-miftahi", 
    author: "Mufti Shoaibullah Khan Miftahi",
    maxPages: 6
  },
  { 
    tag: "muhammad-ishaq-multani-books", 
    subCat: "muhammad-ishaq-multani", 
    author: "Maulana Muhammad Ishaq Multani",
    maxPages: 6
  }
];

async function scrapeScholar(scholar) {
  const baseUrl = `https://besturdubooks.net/tag/${scholar.tag}`;
  const pages = [''];
  for (let i = 2; i <= scholar.maxPages; i++) {
    pages.push(`/page/${i}/`);
  }

  const linksData = [];

  for (const p of pages) {
    const url = baseUrl + p;
    console.log("  Fetching " + url);
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
      const $ = cheerio.load(data);
      
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        
        if (href && href.startsWith('https://besturdubooks.net/') && 
            !href.includes('/tag/') && 
            !href.includes('/category/') && 
            !href.includes('/author/') &&
            !href.includes('how-to-download') &&
            !href.includes('support-us') &&
            !href.includes('tamas') &&
            !href.includes('dars-e-nizami') &&
            !href.includes('dirasaat-e-deenia') &&
            !href.includes('tajweed') &&
            !href.includes('mutafarriq') &&
            href !== 'https://besturdubooks.net/' &&
            !href.includes(scholar.tag)) {
                
            if (href.length > 35) {
                if (!linksData.some(l => l.href === href)) {
                    const slug = href.endsWith('/') ? href.slice(0, -1).split('/').pop() : href.split('/').pop();
                    if (!['contact-us', 'about-us', 'audiobooks'].includes(slug) && !slug.includes("page")) {
                        linksData.push({ text: text || slug, href });
                    }
                }
            }
        }
      });
    } catch(e) {
      console.log("  Page not found or error for " + url);
    }
    await delay(200);
  }

  const finalLinks = linksData.filter(l => {
    return l.href.includes('-') && !l.href.includes('urdu-books') && !l.href.includes('quran-e-majeed');
  });

  console.log(`  Found ${finalLinks.length} unique book links for ${scholar.author}\n`);
  
  const allBooks = [];

  for (let i = 0; i < finalLinks.length; i++) {
    const item = finalLinks[i];
    console.log(`  [${i+1}/${finalLinks.length}] ${item.href}`);

    try {
      const resp = await axios.get(item.href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(resp.data);
      
      let title = $('h1.entry-title').text().trim() || $('h1').first().text().trim();
      if (!title || title.toLowerCase() === 'open' || title.toLowerCase() === 'read online' || title.trim() === '') {
          title = $('title').text().split('|')[0].trim();
          title = title.replace('best urdu books', '').trim();
      }

      let volumes = [];
      $('a').each((idx, link) => {
        const h = $(link).attr('href');
        let linkText = $(link).text().trim();
        if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org/download/') || h.includes('mediafire.com/file/'))) {
           if(!linkText || linkText.toLowerCase() === 'download' || linkText.toLowerCase() === 'open' || linkText.length > 25) {
              linkText = "جلد " + (volumes.length + 1);
           }
           volumes.push({ title: linkText, url: h });
        }
      });
      
      volumes = [...new Map(volumes.map(v => [v.url, v])).values()];

      if (volumes.length === 0) {
         $('.wp-block-button__link, .elementor-button-link').each((idx, btn) => {
            const h = $(btn).attr('href');
            if (h && (h.includes('.pdf') || h.includes('archive.org') || h.includes('mediafire'))) {
               volumes.push({ title: 'Download', url: h });
            }
         });
      }

      let bookImg = null;
      const allImgs = [];
      $('img').each((idx, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
        if (src && (src.toLowerCase().endsWith('.jpg') || src.toLowerCase().endsWith('.png') || src.toLowerCase().endsWith('.jpeg') || src.toLowerCase().endsWith('.webp')) && !src.includes('logo') && !src.includes('banner')) {
            allImgs.push(src);
        }
      });
      
      bookImg = allImgs.find(src => src.includes('new.asasulquran.com'));
      
      if (!bookImg) {
          bookImg = allImgs.find(src => src.includes('uploads'));
      }

      if (!bookImg) bookImg = $('.wp-post-image').first().attr('src') || $('img').first().attr('src');
      if (bookImg && bookImg.startsWith('//')) bookImg = 'https:' + bookImg;
      if (!bookImg) bookImg = 'https://via.placeholder.com/300x450?text=No+Cover';

      if (volumes.length > 0) {
        allBooks.push({
          title: title,
          author: scholar.author,
          category: 'علمائے کرام',
          sub_category: scholar.subCat,
          cover_url: bookImg,
          pdf_url: volumes[0].url,
          description: JSON.stringify(volumes),
          pages: 0,
          is_free: true,
          downloads: 0,
          rating: 0,
          language: 'ur',
          year: 0
        });
        console.log(`    -> Found ${volumes.length} volume(s)`);
      } else {
        console.log(`    -> SKIP: No volumes found`);
      }
    } catch (e) {
      console.log(`    -> ERROR: ${e.message}`);
    }
    
    await delay(150);
  }

  return allBooks;
}

async function run() {
  const grandResults = [];
  const summary = [];

  for (const scholar of scholarsToScrape) {
    console.log(`\n========================================`);
    console.log(`SCRAPING: ${scholar.author} (${scholar.tag})`);
    console.log(`========================================`);
    
    const books = await scrapeScholar(scholar);
    
    if (books.length > 0) {
      // Upsert to Supabase
      console.log(`\n  Upserting ${books.length} books for ${scholar.author}...`);
      
      // Upsert in chunks of 50
      for (let i = 0; i < books.length; i += 50) {
        const chunk = books.slice(i, i + 50);
        const { error } = await supabase.from('Books').upsert(chunk, { onConflict: 'pdf_url' });
        if (error) {
          console.log(`  Upsert error: ${error.message}`);
        } else {
          console.log(`  Upserted chunk ${Math.floor(i/50)+1}: ${chunk.length} books`);
        }
      }
      
      const multiVol = books.filter(b => {
        try { return JSON.parse(b.description).length > 1; } catch(e) { return false; }
      }).length;
      
      summary.push(`${scholar.author}: ${books.length} books scraped (${multiVol} multi-volume)`);
    } else {
      summary.push(`${scholar.author}: 0 books found (tag may be wrong)`);
    }
    
    grandResults.push(...books);
  }

  console.log(`\n\n========== GRAND SUMMARY ==========`);
  summary.forEach(s => console.log(s));
  console.log(`Total books scraped: ${grandResults.length}`);
  
  fs.writeFileSync('tmp/rescrape_summary.txt', summary.join('\n') + `\nTotal: ${grandResults.length}`, 'utf8');
  console.log('Summary saved to tmp/rescrape_summary.txt');
}

run().catch(e => console.error(e));
