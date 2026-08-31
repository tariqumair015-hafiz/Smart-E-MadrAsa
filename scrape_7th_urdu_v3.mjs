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

import { execSync } from 'child_process';

async function fetchWithRetry(url, limit = 5) {
  for (let i = 0; i < limit; i++) {
    try {
      console.log(`    Fetching with curl: ${url}`);
      const stdout = execSync(`curl -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0" "${url}"`, { maxBuffer: 10 * 1024 * 1024 });
      const html = stdout.toString('utf8');
      if (html.length < 1000) throw new Error("Suspiciously small HTML returned");
      return html;
    } catch (e) {
      console.log(`    [Retry ${i+1}/${limit}] Failed: ${e.message.split('\\n')[0]}`);
      await delay(2000);
    }
  }
  throw new Error(`Failed to fetch ${url} after ${limit} retries`);
}

async function scrapePage(page) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}page/${page}/`;
  console.log(`\n📄 Page ${page}: ${url}`);
  
  try {
    const htmlText = await fetchWithRetry(url);
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

      if (!title || title.length < 3) {
        let prev = img.parent().prev();
        let searchLimit = 0;
        while (prev.length && (!title || title.length < 3) && searchLimit < 10) {
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
      let detailPageUrl = null;

      const processAnchor = (a) => {
        const link = $(a);
        const href = link.attr('href') || '';
        let textLower = link.text().trim().toLowerCase();

        if (href.includes('besturdubooks.net/') && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/dars-e-nizami/')) {
             detailPageUrl = href;
        }

        if (textLower.includes('link 2') || textLower.includes('read online') || textLower.includes('link 02')) {
            return;
        }

        if (href && (
          href.includes('archive.org/download') ||
          href.includes('archive.org/details') ||
          href.includes('mediafire.com') ||
          href.includes('drive.google.com')
        )) {
          let volTitle = link.text().trim() || `Volume ${volumes.length + 1}`;
          if (volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('click here') || volTitle.toLowerCase().includes('link 1')) {
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

      while (scan.length && limit < 15) {
        scan = scan.next();
        if (!scan.length || scan.find('img').length > 0) break; // Next book
        if (scan[0] && scan[0].tagName && scan[0].tagName.toLowerCase() === 'hr') break; // Next book

        scan.find('a').each((j, a) => processAnchor(a));
        limit++;
      }

      if (title && volumes.length === 0 && detailPageUrl && detailPageUrl.startsWith('http')) {
          books.push({
             _needsDetail: true,
             detailPageUrl,
             title,
             cover_url: coverUrl,
             sub_category: SUB_CATEGORY,
             category: CATEGORY,
          });
      } else if (title && volumes.length > 0) {
        books.push({
          title,
          cover_url: coverUrl,
          volumes,
          pdf_url: volumes[0].url,
          sub_category: SUB_CATEGORY,
          category: CATEGORY,
        });
        console.log(`  Added: ${title.substring(0, 50)}... (${volumes.length} vols)`);
      }
    });

    console.log(`  Resolving detail pages for ${books.filter(b => b._needsDetail).length} books...`);
    for (let b of books) {
        if (b._needsDetail) {
             try {
                 const html = await fetchWithRetry(b.detailPageUrl, 2);
                 const sub$ = cheerio.load(html);
                 const vols = [];
                 
                 sub$('.entry-content a, .post-content a').each((i, a) => {
                     const link = sub$(a);
                     const href = link.attr('href') || '';
                     const textLower = link.text().toLowerCase();
                     
                     if (textLower.includes('link 2') || textLower.includes('link 02') || textLower.includes('read online') || textLower.includes('link 3')) {
                         return;
                     }
                     
                     if (href && (href.includes('archive.org/download') || href.includes('archive.org/details') || href.includes('mediafire.com') || href.includes('drive.google.com'))) {
                          let volTitle = link.text().trim() || `Volume ${vols.length + 1}`;
                          if (volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('link 1')) {
                              volTitle = `Volume ${vols.length + 1}`;
                          }
                          let downloadUrl = href;
                          if (href.includes('archive.org/details/')) downloadUrl = href.replace('/details/', '/download/');
                          
                          if (!vols.find(v => v.url === downloadUrl)) {
                              vols.push({ title: volTitle, url: downloadUrl });
                          }
                     }
                 });
                 
                 if (vols.length > 0) {
                     b.volumes = vols;
                     b.pdf_url = vols[0].url;
                     delete b._needsDetail;
                     delete b.detailPageUrl;
                     console.log(`  Added from detail: ${b.title.substring(0, 50)}... (${vols.length} vols)`);
                 }
             } catch(e) {
                 console.error(`    Failed subpage for ${b.title}`);
             }
        }
    }
    
    // filter out the ones that failed
    const validBooks = books.filter(b => !b._needsDetail && b.pdf_url);

    console.log(`✅ Page ${page} finished. Books extracted: ${validBooks.length}`);
    return validBooks;
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
    if (books.length > 0) {
      await uploadToDB(books);
    } else {
      console.log('⚠️ No books scraped. Check connection or DOM selectors.');
    }
}

run();
