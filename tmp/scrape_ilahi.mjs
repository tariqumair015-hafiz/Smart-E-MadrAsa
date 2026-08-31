import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const baseUrl = 'https://besturdubooks.net/tag/maulana-ashiq-ilahi-books';
  const pages = ['', '/page/2/', '/page/3/'];
  const linksData = [];

  for (const p of pages) {
    const url = baseUrl + p;
    console.log("Fetching " + url);
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
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
            !href.includes('maulana-ashiq-ilahi-books')) {
                
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
          author: "Maulana Ashiq Ilahi Bulandshehri",
          category: 'علمائے کرام',
          sub_category: 'maulana-ashiq-ilahi',
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
        console.log("  -> SUCCESS: Found " + volumes.length + " volumes. Cover: " + bookImg);
      } else {
        console.log("  -> FAILED: No volumes found.");
      }
    } catch (e) {
      console.log("  -> ERROR: " + e.message);
    }
    
    await delay(300);
  }

  if (allBooks.length > 0) {
     console.log("Upserting " + allBooks.length + " books into Supabase...");
     const { data, error } = await supabase.from('Books').upsert(allBooks, { onConflict: 'pdf_url' }).select('id');
     if (error) { console.error("Upsert failed:", JSON.stringify(error)); } 
     else { console.log("SUCCESSFULLY ADDED/UPDATED " + data.length + " BOOKS!"); }
  } else {
     console.log("No books were collected.");
  }
}

run().catch(e => console.error(e));
