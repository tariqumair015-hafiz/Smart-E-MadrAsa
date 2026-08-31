import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const allBooks = [];
  const startPage = 1;
  const endPage = 3;

  for (let page = startPage; page <= endPage; page++) {
    const url = page === 1
      ? 'https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/'
      : `https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/page/${page}/`;

    console.log(`\n-----------------------------------------`);
    console.log(`Scraping page ${page}/${endPage}: ${url}`);
    console.log(`-----------------------------------------`);
    try {
      const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(data);

      const links = [];
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
        
        // Exclude category sidebars, pagination, etc. The most robust way is to ensure inner img exists 
        // and URL doesn't contain category patterns. BestUrduBooks individual book URLs rarely have /category/
        // or /dars-e-nizami/ in them, they are top-level like besturdubooks.net/book-title/
        if (
          href &&
          href.startsWith('https://besturdubooks.net/') &&
          !href.includes('/category/') &&
          !href.includes('/tag/') &&
          !href.includes('/author/') &&
          !href.includes('/page/') &&
          !href.includes('/dars-e-nizami/') &&
          href.length > 30 &&
          img
        ) {
          links.push(href);
        }
      });

      const uniqueLinks = [...new Set(links)];
      console.log(`  Found ${uniqueLinks.length} candidate individual book links.`);

      for (const href of uniqueLinks) {
        if (href.includes('/contact-us/') || href.includes('/about-us/') || href.includes('/privacy-policy/')) continue;

        console.log(`    → Fetching: ${href.substring(0, 50)}...`);

        try {
          const res = await axios.get(href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
          const $2 = cheerio.load(res.data);
          
          let title = $2('h1.entry-title').text().trim() || $2('h1').first().text().trim();
          
          if (!title || title.length < 5) {
             console.log(`      ✕ Title too short or not found`);
             continue;
          }

          let volumes = [];
          $2('a').each((i, link) => {
            const h = $2(link).attr('href');
            let linkText = $2(link).text().trim() || $2(link).attr('title') || `جلد ${volumes.length + 1}`;
            
            // Sometimes text is empty, ensure we have a label
            if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org/download/') || h.includes('mediafire.com/file/'))) {
               // Cleanup title text
               if(linkText.toLowerCase().includes('download') || linkText.toLowerCase().includes('pdf') || linkText.length < 2) {
                   linkText = `جلد ${volumes.length + 1}`;
               }
               volumes.push({ title: linkText, url: h });
            }
          });

          // Fallback if no specific volumes found but we find direct links without text
          if(volumes.length === 0) {
             $2('a').each((i, link) => {
                const h = $2(link).attr('href');
                if (h && (h.toLowerCase().includes('.pdf'))) {
                   volumes.push({ title: `جلد ${volumes.length + 1}`, url: h });
                }
             });
          }

          volumes = [...new Map(volumes.map(v => [v.url, v])).values()];

          const bookImg = $2('img.wp-post-image').attr('src') || $2('img.wp-post-image').attr('data-src') || $2('.entry-content img').first().attr('src');

          if (volumes.length > 0) {
            let subCat = 'درسی کتب'; // These are all textbooks as per URL
            
            allBooks.push({
              title,
              author: 'نامعلوم',
              category: 'دورہ حدیث',
              sub_category: subCat,
              cover_url: bookImg || 'https://via.placeholder.com/200x300?text=No+Cover',
              pdf_url: volumes[0].url,
              description: JSON.stringify(volumes),
              pages: 0,
              is_free: true,
              downloads: 0,
              rating: 0,
              language: 'ur'
            });
            console.log(`      ✓ [${subCat}] Saved into allBooks array (${volumes.length} Volumes)`);
          } else {
             console.log(`      ✕ No PDF links found`);
          }
        } catch (e) {
          console.log(`      ✕ Error: ${e.message}`);
        }
        await delay(300);
      }
      
      if (allBooks.length > 0) {
        const toSave = [...allBooks];
        allBooks.length = 0;
        console.log(`  Updating Supabase with ${toSave.length} books...`);
        const { error } = await supabase.from('Books').upsert(toSave, { onConflict: 'pdf_url' });
        if (error) console.error('  Save error:', error.message);
        else console.log(`  ✅ DB updated for page ${page}`);
      }

    } catch (e) {
      console.error(`Error page ${page}: ${e.message}`);
    }
  }
}

run();
