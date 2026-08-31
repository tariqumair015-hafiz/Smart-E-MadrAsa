import { chromium } from 'playwright';
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

async function scrapeAll() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  const allBooks = [];

  // Phase 1: Extract listings
  for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
    const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page/${pageNum}/`;
    console.log(`\n📄 Navigating to Page ${pageNum}: ${url}`);
    
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log("  Page loaded. Evaluating scraper script...");
        
        const pageBooks = await page.evaluate(({subCat, cat}) => {
            const books = [];
            const content = document.querySelector('.entry-content') || document.querySelector('.post-content');
            if (!content) return [];

            const images = Array.from(content.querySelectorAll('img'));
            
            for (let img of images) {
                let coverUrl = img.getAttribute('data-lazy-src') || img.getAttribute('data-src') || img.getAttribute('data-orig-src') || img.getAttribute('src') || '';
                if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder') || coverUrl.includes('icon') || coverUrl.length < 20) continue;
                
                if (coverUrl.includes('wp.com')) {
                    coverUrl = coverUrl.replace(/https?:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
                } else if (coverUrl.includes('?')) {
                    coverUrl = coverUrl.split('?')[0];
                }
                
                let title = img.getAttribute('alt') || img.getAttribute('title') || '';
                title = title.replace(/Download Link \d+/gi, '').replace(/Download/gi, '').replace(/\[.*?\]/g, '').replace(/^\d+\.\s*/, '').trim();
                
                if (!title || title.length < 3) {
                    let prev = img.parentElement.previousElementSibling;
                    let searchLimit = 0;
                    if (!prev && img.closest('.entry-content > *')) {
                        prev = img.closest('.entry-content > *').previousElementSibling;
                    }
                    while (prev && (!title || title.length < 3) && searchLimit < 10) {
                        const text = prev.textContent.trim();
                        if (text && text.length > 4 && 
                            !text.toLowerCase().includes('click here') && 
                            !text.toLowerCase().includes('download link') && 
                            !text.toLowerCase().includes('nisab') &&
                            !text.match(/^\d+\.$/) &&
                            !text.match(/^(volume|vol|part)\s*\d+$/i)) {
                            title = text;
                        }
                        prev = prev.previousElementSibling;
                        searchLimit++;
                    }
                }
                
                let volumes = [];
                let scan = img.closest('.entry-content > *');
                if (!scan) scan = img.parentElement;
                
                let limit = 0;
                let detailPageUrl = null;
                
                const processAnchor = (a) => {
                    const href = a.getAttribute('href') || '';
                    let textLower = a.textContent.trim().toLowerCase();
                    
                    if (href.includes('besturdubooks.net/') && !href.includes('/category/') && !href.includes('/tag/') && !href.includes('/dars-e-nizami/')) {
                         detailPageUrl = href;
                    }

                    if (textLower.includes('link 2') || textLower.includes('link 02') || textLower.includes('read online') || textLower.includes('link 3')) {
                        return;
                    }
                    
                    if (href && (href.includes('archive.org/download') || href.includes('archive.org/details') || href.includes('mediafire.com') || href.includes('drive.google.com'))) {
                        let volTitle = a.textContent.trim() || `Volume ${volumes.length + 1}`;
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
                
                // Links in same node
                Array.from(scan.querySelectorAll('a')).forEach(processAnchor);
                
                // Next siblings
                while (scan && limit < 15) {
                    scan = scan.nextElementSibling;
                    if (!scan || scan.querySelector('img') || scan.tagName.toLowerCase() === 'hr') break;
                    
                    Array.from(scan.querySelectorAll('a')).forEach(processAnchor);
                    limit++;
                }

                if (title && volumes.length === 0 && detailPageUrl && detailPageUrl.startsWith('http')) {
                    books.push({
                        _needsDetail: true,
                        detailPageUrl,
                        title,
                        cover_url: coverUrl,
                        sub_category: subCat,
                        category: cat,
                    });
                } else if (title && volumes.length > 0) {
                    books.push({
                        title,
                        cover_url: coverUrl,
                        volumes,
                        pdf_url: volumes[0].url,
                        sub_category: subCat,
                        category: cat,
                    });
                }
            }
            return books;
        }, {subCat: SUB_CATEGORY, cat: CATEGORY});

        console.log(`  ✅ Extracted ${pageBooks.length} books.`);
        allBooks.push(...pageBooks);
        await delay(2000);

    } catch (err) {
        console.error(`  ❌ Error on page ${pageNum}:`, err.message);
    }
  }

  // Phase 2: Fetch missing details using Playwright logic directly
  const needsDetail = allBooks.filter(b => b._needsDetail);
  console.log(`\n🔍 Found ${needsDetail.length} books requiring detail page parsing.`);
  
  for (let b of needsDetail) {
      console.log(`  => Navigating to detail page: ${b.title.substring(0, 40)}...`);
      try {
          await page.goto(b.detailPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const detailVols = await page.evaluate(() => {
                const vols = [];
                Array.from(document.querySelectorAll('.entry-content a, .post-content a')).forEach(a => {
                     let href = a.getAttribute('href') || '';
                     let textLower = a.textContent.trim().toLowerCase();
                     
                     if (textLower.includes('link 2') || textLower.includes('link 02') || textLower.includes('read online') || textLower.includes('link 3') || textLower.includes('/category/') || textLower.includes('/tag/') || textLower.includes('/dars-e-nizami/')) {
                         return;
                     }
                     
                     if (href && (href.includes('archive.org/download') || href.includes('archive.org/details') || href.includes('mediafire.com') || href.includes('drive.google.com') || href.includes('besturdubooks.net/download'))) {
                          let volTitle = a.textContent.trim() || `Volume ${vols.length + 1}`;
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
                return vols;
          });
          
          if (detailVols.length > 0) {
              b.volumes = detailVols;
              b.pdf_url = detailVols[0].url;
              console.log(`    ✅ Success: Found ${detailVols.length} volumes.`);
          } else {
              console.log(`    ⚠️ No archive/mediafire links found on detail page.`);
          }
      } catch(err) {
          console.error(`    ❌ Error on detail page: ${err.message}`);
      }
      await delay(1000);
  }

  await browser.close();

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
          size_mb: 15,
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
      console.log('⚠️ No books scraped.');
    }
}

run();
