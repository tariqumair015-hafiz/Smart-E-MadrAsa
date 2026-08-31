import { chromium } from 'playwright';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'اکابرین';
const SUB_CATEGORY = 'maulana-saeed-ahmad-palanpuri';
const YEAR = 0;
const BASE_URL = 'https://besturdubooks.net/tag/maulana-mufti-saeed-ahmad-palanpuri-books/';
const TOTAL_PAGES = 6;

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapeAll() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const allBookUrls = new Set();

  for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
    const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page/${pageNum}/`;
    console.log(`\n📄 Navigating to Tag Page ${pageNum}: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('  Page loaded. Extracting book URLs...');
      const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.wp-block-post a.kb-advanced-heading-link'));
        return links.map(a => a.href);
      });
      console.log(`  Found ${urls.length} links on this page.`);
      urls.forEach(u => allBookUrls.add(u));
    } catch (err) {
      console.error(`  ❌ Error on tag page ${pageNum}:`, err.message);
    }
  }

  const allBooks = [];
  const bookUrlsArray = Array.from(allBookUrls);
  console.log(`\n🔍 Total unique book pages: ${bookUrlsArray.length}. Starting deep scrape...`);

  for (let i = 0; i < bookUrlsArray.length; i++) {
    const bookUrl = bookUrlsArray[i];
    console.log(`\n📚 [${i + 1}/${bookUrlsArray.length}] Scraping Book: ${bookUrl}`);
    try {
      await page.goto(bookUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const bookData = await page.evaluate(() => {
        const content = document.querySelector('.entry-content') || document.querySelector('.post-content');
        if (!content) return null;

        // Cover image extraction
        let coverUrl = '';
        const mainImg = content.querySelector('img');
        if (mainImg) {
          coverUrl = mainImg.getAttribute('data-lazy-src') || mainImg.getAttribute('data-src') || mainImg.getAttribute('data-orig-src') || mainImg.getAttribute('src') || '';
          if (coverUrl.includes('wp.com')) {
            coverUrl = coverUrl.replace(/https?:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
          } else if (coverUrl.includes('?')) {
            coverUrl = coverUrl.split('?')[0];
          }
        }

        // Title extraction
        let title = document.querySelector('h1.entry-title')?.textContent?.trim() || '';
        if (!title) {
          title = mainImg ? (mainImg.getAttribute('alt') || mainImg.getAttribute('title') || '') : '';
        }
        title = title.replace(/Download Link \d+/gi, '').replace(/Download/gi, '').replace(/\[.*?\]/g, '').replace(/^\d+\.\s*/, '').trim();

        // Volume links extraction
        const volumes = [];
        const links = Array.from(content.querySelectorAll('a'));
        links.forEach(a => {
          const href = a.getAttribute('href') || '';
          const txt = a.textContent.trim().toLowerCase();
          if (txt.includes('link 2') || txt.includes('link 02') || txt.includes('read online') || txt.includes('link 3')) return;
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
        });

        if (title && volumes.length > 0) {
          return { title, cover_url: coverUrl, volumes, pdf_url: volumes[0].url };
        }
        return null;
      });

      if (bookData) {
        console.log(`  ✅ Extracted: ${bookData.title.substring(0, 40)} (${bookData.volumes.length} vols)`);
        allBooks.push(bookData);
      } else {
        console.log('  ❌ Insufficient data (missing cover or volumes).');
      }
    } catch (err) {
      console.error('  ❌ Error on book page:', err.message);
    }
  }

  await browser.close();
  console.log(`\n✅ SCRAPING COMPLETE! Total books: ${allBooks.length}`);
  return allBooks;
}

async function uploadToDB(books) {
  console.log(`\n📤 Uploading ${books.length} books to Supabase...`);
  let uploaded = 0;
  let skipped = 0;
  for (const book of books) {
    try {
      const dbBook = {
        title: book.title,
        author: 'Maulana Saeed Ahmad Palanpuri',
        category: CATEGORY,
        sub_category: SUB_CATEGORY,
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
    } catch (e) {
      console.log(`  ❌ Exception on ${book.title}:`, e.message);
      skipped++;
    }
  }
  console.log(`\n🏁 FINISH! Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

async function run() {
  const books = await scrapeAll();
  fs.writeFileSync('palanpuri_books.json', JSON.stringify(books, null, 2), 'utf8');
  if (books.length > 0) {
    await uploadToDB(books);
  } else {
    console.log('⚠️ No books scraped. Check selectors or connectivity.');
  }
}

run();
