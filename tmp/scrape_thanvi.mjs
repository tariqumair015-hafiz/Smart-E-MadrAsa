import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const baseUrl = 'https://besturdubooks.net/tag/maulana-ashraf-ali-thanvi-books';
  const pages = [''];
  for (let i = 2; i <= 21; i++) {
     pages.push(`/page/${i}/`);
  }
  const linksData = [];

  for (const p of pages) {
    const url = baseUrl + p;
    console.log("Fetching " + url);
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
            !href.includes('maulana-ashraf-ali-thanvi-books')) {
                
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
      console.log("Page not found or error for " + url);
    }
  }

  const finalLinks = linksData.filter(l => {
    return l.href.includes('-') && !l.href.includes('urdu-books') && !l.href.includes('quran-e-majeed');
  });

  console.log("Found " + finalLinks.length + " unique book links.");
  
  const allBooks = [];
  const batchSize = 100;

  for (let i = 0; i < finalLinks.length; i++) {
    const item = finalLinks[i];
    console.log("[" + (i+1) + "/" + finalLinks.length + "] Processing URL: " + item.href);

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
        if (src && src.toLowerCase().endsWith('.jpg') && !src.includes('logo') && !src.includes('banner')) {
            allImgs.push(src);
        }
      });
      
      bookImg = allImgs.find(src => (src.includes('new.asasulquran.com') && !src.includes('ISLAHI') && !src.includes('TADVEEN') && !src.includes('Masabeeh')));
      
      if (!bookImg) {
          bookImg = allImgs.find(src => (!src.includes('ISLAHI') && !src.includes('TADVEEN') && !src.includes('Masabeeh') && src.includes('uploads')));
      }

      if (!bookImg) bookImg = $('.wp-post-image').first().attr('src') || $('img').first().attr('src');
      if (bookImg && bookImg.startsWith('//')) bookImg = 'https:' + bookImg;
      if (!bookImg) bookImg = 'https://via.placeholder.com/300x450?text=No+Cover';

      if (volumes.length > 0) {
        allBooks.push({
          title: title,
          author: "Maulana Ashraf Ali Thanvi",
          category: 'علمائے کرام',
          sub_category: 'maulana-ashraf-ali-thanvi',
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
        console.log("  -> SUCCESS: Found " + volumes.length + " volumes.");
      } else {
        console.log("  -> FAILED: No volumes found.");
      }
    } catch (e) {
      console.log("  -> ERROR: " + e.message);
    }
    
    // Push chunks
    if (allBooks.length > 0 && allBooks.length % batchSize === 0) {
        console.log(`Upserting intermediate batch of ${batchSize} books...`);
        const { error } = await supabase.from('Books').upsert(allBooks.slice(-batchSize), { onConflict: 'pdf_url' });
        if(error) console.log("Batch upsert error: ", error.message);
    }

    await delay(150);
  }

  // Final upsert
  const remainder = allBooks.length % batchSize;
  if (remainder > 0) {
     console.log(`Upserting final batch of ${remainder} books...`);
     const { data, error } = await supabase.from('Books').upsert(allBooks.slice(-remainder), { onConflict: 'pdf_url' }).select('id');
     if (error) { console.error("Upsert failed:", JSON.stringify(error)); } 
     else { console.log("FINAL BATCH UPDATED!"); }
  } else if (allBooks.length === 0) {
     console.log("No books were collected.");
  }
  
  console.log(`GRAND TOTAL UPSERTED: ${allBooks.length} books.`);
}

run().catch(e => console.error(e));
