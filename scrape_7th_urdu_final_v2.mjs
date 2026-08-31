import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'درجہ سابعہ';
const SUB_CATEGORY = 'اردو شروحات';
const YEAR = 7;
const BASE_URL = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/';
const TOTAL_PAGES = 6;

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function scrapePage(page) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}page/${page}/`;
  console.log(`\n📄 Page ${page}: ${url}`);
  
  try {
    const res = await fetch(url, {
      headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const htmlText = await res.text();
    const $ = cheerio.load(htmlText);
    const content = $('.entry-content, .post-content').first();
    const images = content.find('img');
    const books = [];

    console.log(`  Found ${images.length} images`);

    images.each((i, imgEl) => {
      const img = $(imgEl);

      let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src') || '';
      if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder') || coverUrl.includes('icon') || coverUrl.length < 20) return;

      if (coverUrl.includes('wp.com')) {
        coverUrl = coverUrl.replace(/https?:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
      } else if (coverUrl.includes('?')) {
        coverUrl = coverUrl.split('?')[0];
      }

      let title = img.attr('alt') || img.attr('title') || '';
      title = title.replace(/Download Link \d+/gi, '').replace(/Download/gi, '').replace(/\[.*?\]/g, '').replace(/^\d+\.\s*/, '').trim();

      if (!title) {
        let prev = img.parent().prev();
        let searchLimit = 0;
        while (prev.length && !title && searchLimit < 10) {
          const text = prev.text().trim();
          if (text && text.length > 4 &&
            !text.toLowerCase().includes('click here') &&
            !text.toLowerCase().includes('download link') &&
            !text.toLowerCase().includes('nisab') &&
            !text.match(/^\d+\.$/) &&
            !text.match(/^(volume|vol|part)\s*\d+$/i)) {
            title = text;
          }
          prev = prev.prev();
          searchLimit++;
        }
      }

      const volumes = [];
      let scan = img.closest('.entry-content > *');
      if (scan.length === 0) scan = img.parent();
      
      let limit = 0;
      let isLink2 = false;

      const processAnchor = (a) => {
        if (isLink2) return;
        const link = $(a);
        const href = link.attr('href') || '';
        let text = link.text().trim();

        if (href && (
          href.includes('archive.org/download') ||
          href.includes('archive.org/details') ||
          href.includes('mediafire.com')
        )) {
          let volTitle = text || `Volume ${volumes.length + 1}`;
          if (volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('click here') || volTitle.toLowerCase() === 'link 1') {
              volTitle = `Volume ${volumes.length + 1}`;
          }
          
          let downloadUrl = href;
          if (href.includes('archive.org/details/')) downloadUrl = href.replace('/details/', '/download/');

          if (!volumes.find(v => v.url === downloadUrl)) {
            volumes.push({ title: volTitle, url: downloadUrl });
          }
        }
      };

      // Check current node links
      scan.find('a').each((j, a) => processAnchor(a));

      while (scan.length && limit < 20) {
        scan = scan.next();
        if (!scan.length || scan.find('img').length > 0) break; // Next book
        
        const textContent = scan.text().toLowerCase();
        if (textContent.includes('link 2') || textContent.includes('read online') || textContent.includes('link 02')) {
            isLink2 = true;
        }

        if (!isLink2) {
            scan.find('a').each((j, a) => processAnchor(a));
        }
        limit++;
      }

      if (title && volumes.length > 0) {
        books.push({
          title,
          cover_url: coverUrl,
          volumes,
          pdf_url: volumes[0].url,
          sub_category: SUB_CATEGORY,
          category: CATEGORY,
        });
        console.log(`  Added: ${title.substring(0, 40)}... (${volumes.length} vols)`);
      }
    });

    console.log(`✅ Page ${page} finished. Books found: ${books.length}`);
    return books;
  } catch (err) {
    console.error(`  ❌ Error on page ${page}:`, err.message);
    return [];
  }
}

async function scrapeAll() {
  const allBooks = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const pageBooks = await scrapePage(page);
    allBooks.push(...pageBooks);
    await delay(1500);
  }

  // Handle unique
  const finalBooks = [];
  const validBooks = allBooks.filter(b => b.pdf_url && b.cover_url);
  for (const b of validBooks) {
    if (!finalBooks.find(fb => fb.pdf_url === b.pdf_url)) {
      finalBooks.push(b);
    }
  }

  console.log(`\n✅ SCRAPING COMPLETE! Total unique books: ${finalBooks.length}`);
  return finalBooks;
}

async function uploadToDB(books) {
    console.log(`\n📤 Uploading ${books.length} books to Supabase...`);
  
    // Delete existing records to sync nicely with standard data structures
    const { error: delError } = await supabase
        .from('Books')
        .delete()
        .eq('category', CATEGORY)
        .eq('sub_category', SUB_CATEGORY);
    
    if (delError) {
        console.error('Error deleting old data:', delError.message);
    } else {
        console.log('Old records deleted.');
    }

    let uploaded = 0;
    let skipped = 0;
  
    for (const book of books) {
      try {
        const dbBook = {
          title: book.title,
          author: 'BestUrduBooks',
          category: CATEGORY,
          sub_category: book.sub_category,
          cover_url: book.cover_url,
          pdf_url: book.pdf_url,
          description: JSON.stringify(book.volumes),
          size_mb: 15, // Arbitrary average size
          is_free: true,
          downloads: 0,
          rating: 0,
          pages: 0,
          year: YEAR,
        };
  
        const { error } = await supabase.from('Books').upsert([dbBook], { onConflict: 'pdf_url' });
        if (error) {
          console.log(`  ❌ [SKIP] ${book.title.substring(0, 50)}: ${error.message}`);
          skipped++;
        } else {
          console.log(`  ✅ [OK] ${book.title.substring(0, 50)} (${book.volumes.length} vols)`);
          uploaded++;
        }
      } catch (err) {
        console.log(`  Exception on ${book.title}:`, err.message);
        skipped++;
      }
    }
  
    console.log(`\n🏁 FINISH! Uploaded/Updated: ${uploaded}, Skipped: ${skipped}`);
}

async function run() {
    const books = await scrapeAll();
    fs.writeFileSync('tmp_7th_urdu_books.json', JSON.stringify(books, null, 2), 'utf8');
    await uploadToDB(books);
}

run();
