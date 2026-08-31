import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const landingUrl = 'https://besturdubooks.net/tag/allama-shibli-nomani-books/';
  console.log("Fetching Shibli Nomani books landing page...");
  const response = await axios.get(landingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
  
  const $l = cheerio.load(response.data);
  const linksData = [];
  
  $l('a').each((i, el) => {
    const href = $l(el).attr('href');
    const text = $l(el).text().trim();
    if (href && href.startsWith('https://besturdubooks.net/') && 
        !href.includes('/tag/') && 
        !href.includes('/category/') && 
        !href.includes('/dars-e-nizami/') && 
        !href.includes('/how-to-download/')) {
        
        const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href;
        const slug = cleanHref.split('/').pop() || '';
        const targetKeywords = ['shibli', 'nomani', 'nabi', 'farooq', 'ghazali', 'mamoon', 'maqalat', 'sher-ul-ajam', 'anis', 'noman'];
        
        if (targetKeywords.some(k => slug.includes(k)) || text.includes('شبلی') || text.includes('نعمانی')) {
           if (!linksData.some(l => l.href === href)) {
              linksData.push({ text, href });
           }
        }
    }
  });

  console.log("Found " + linksData.length + " unique book links (potential).");
  const allBooks = [];

  for (let i = 0; i < linksData.length; i++) {
    const item = linksData[i];
    if (item.href === landingUrl) continue;

    console.log("[" + (i+1) + "/" + linksData.length + "] Processing URL: " + item.href);

    try {
      const resp = await axios.get(item.href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(resp.data);
      
      let title = $('h1.entry-title').text().trim() || $('h1').first().text().trim() || item.text;
      if (!title || title.toLowerCase() === 'open' || title.toLowerCase() === 'read online') {
          title = $('title').text().split('|')[0].trim();
      }

      let volumes = [];
      $('a').each((idx, link) => {
        const h = $(link).attr('href');
        let linkText = $(link).text().trim();
        // Look for PDF or Archive or Mediafire links
        if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org/download/') || h.includes('mediafire.com/file/'))) {
           if(!linkText || linkText.toLowerCase() === 'download' || linkText.toLowerCase() === 'open' || linkText.length > 20) {
              linkText = "جلد " + (volumes.length + 1);
           }
           volumes.push({ title: linkText, url: h });
        }
      });
      
      // De-duplicate volumes by URL
      volumes = [...new Map(volumes.map(v => [v.url, v])).values()];

      // If no direct PDF links, look for buttons that might lead to a redirecting page
      if (volumes.length === 0) {
         $('.wp-block-button__link, .elementor-button-link').each((idx, btn) => {
            const h = $(btn).attr('href');
            if (h && (h.includes('.pdf') || h.includes('archive.org') || h.includes('mediafire'))) {
               volumes.push({ title: 'Download', url: h });
            }
         });
      }

      let bookImg = null;
      $('.entry-content img').each((idx, img) => {
          let src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src');
          if (src && !src.includes('logo') && !src.includes('banner') && src.includes('besturdubooks.net/wp-content/uploads/')) {
              bookImg = src;
              return false;
          }
      });
      if (!bookImg) bookImg = $('.wp-post-image').first().attr('src') || $('img').first().attr('src');
      if (bookImg && bookImg.startsWith('//')) bookImg = 'https:' + bookImg;
      if (!bookImg) bookImg = 'https://via.placeholder.com/300x450?text=No+Cover';

      if (volumes.length > 0) {
        allBooks.push({
          title: title,
          author: "Allama Shibli Nomani",
          category: 'علمائے کرام',
          sub_category: 'allama-shibli-nomani',
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
        console.log("  -> SUCCESS: Found " + volumes.length + " volumes for: " + title);
      } else {
        console.log("  -> FAILED: No volumes found for: " + title);
      }
    } catch (e) {
      console.log("  -> ERROR: " + e.message);
    }
    
    await delay(500);
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
