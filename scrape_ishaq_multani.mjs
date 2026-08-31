import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'اکابرین';
const SUB_CATEGORY = 'muhammad-ishaq-multani';
const BASE_URL = 'https://besturdubooks.net/tag/muhammad-ishaq-multani-books/';
const TOTAL_PAGES = 6;

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function scrapeAll() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const allBookUrls = new Set();

  for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
    const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page/${pageNum}/`;
    console.log(`\n≡ƒöä Navigating to Tag Page ${pageNum}: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('  Page loaded. Extracting book URLs...');
      const urls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.map(a => a.href).filter(h => h && h.includes('besturdubooks.net') && h !== 'javascript:void(0)');
      });
      console.log(`  Found ${urls.length} links on this page.`);
      urls.forEach(u => {
        if (u.match(/besturdubooks\.net\/[a-z0-9\-]+\/$/) && !u.includes('tag/') && !u.includes('author/')) {
          allBookUrls.add(u);
        }
      });
    } catch (error) {
      console.error(`  Error on page ${pageNum}:`, error.message);
    }
  }

  console.log(`\n≡ƒöì Total unique book pages: ${allBookUrls.size}. Starting deep scrape...`);

  const books = [];
  let bookIndex = 0;

  for (const bookUrl of allBookUrls) {
    bookIndex++;
    console.log(`≡ƒôÜ [${bookIndex}/${allBookUrls.size}] Scraping Book: ${bookUrl}`);

    try {
      await page.goto(bookUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(500);

      const bookData = await page.evaluate(() => {
        const title = document.querySelector('h1.entry-title')?.textContent || document.querySelector('h1')?.textContent || '';
        const coverImg = document.querySelector('img.wp-post-image')?.src || document.querySelector('.featured-image img')?.src || '';
        
        //Extract PDF URL from various sources
        let pdfUrl = '';
        
        // Try multiple approaches to find download link
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        
        for (const link of allLinks) {
          const href = link.getAttribute('href') || '';
          const text = link.textContent?.toLowerCase() || '';
          
          // Priority 1: Direct PDF links
          if (href.includes('.pdf') && href.startsWith('http')) {
            pdfUrl = href;
            break;
          }
          // Priority 2: Archive.org links
          if (href.includes('archive.org/download') || href.includes('archive.org/details')) {
            pdfUrl = href;
            break;
          }
          // Priority 3: Google Drive or MediaFire links
          if (href.includes('drive.google.com') || href.includes('mediafire.com')) {
            pdfUrl = href;
            break;
          }
          // Priority 4: Links with download text
          if ((text.includes('download') || text.includes('read online') || text.includes('link')) && href.startsWith('http')) {
            pdfUrl = href;
            break;
          }
        }
        
        return {
          title: title.trim(),
          cover_url: coverImg,
          pdf_url: pdfUrl
        };
      });

      if (bookData.title) {
        books.push({
          title: bookData.title,
          author: 'مولانا محمد اسحاق ملتانی',
          category: CATEGORY,
          sub_category: SUB_CATEGORY,
          cover_url: bookData.cover_url || '',
          pdf_url: bookData.pdf_url || '',
          description: JSON.stringify({
            short: bookData.title,
            volumes: [{ volume: 1, title: bookData.title }]
          }),
          is_free: true,
          pages: 0,
          year: 0,
          size_mb: 0,
          downloads: 0,
          rating: 0
        });
      }
    } catch (error) {
      console.error(`  Error scraping ${bookUrl}:`, error.message);
    }
  }

  await browser.close();
  return books;
}

async function uploadToSupabase(books) {
  console.log('\n  Uploading to Supabase...');

  // Filter out books without proper URLs and remove duplicates
  const uniqueBooks = new Map();
  books.forEach(book => {
    // Only keep books with pdf_url
    if (book.pdf_url && book.pdf_url.trim()) {
      const key = book.pdf_url; // Use pdf_url as unique key
      if (!uniqueBooks.has(key)) {
        uniqueBooks.set(key, book);
      }
    }
  });

  const uploadBooks = Array.from(uniqueBooks.values()).map(book => ({
    title: book.title,
    author: book.author,
    category: book.category,
    sub_category: book.sub_category,
    cover_url: book.cover_url,
    pdf_url: book.pdf_url,
    description: book.description,
    is_free: true,
  }));

  if (uploadBooks.length === 0) {
    console.log(`\n≡ƒôè Upload Summary - Successfully uploaded: 0/${books.length}`);
    console.log(`No valid books with PDF URLs to upload`);
    return;
  }

  const { error } = await supabase.from('Books').upsert(uploadBooks, { onConflict: 'pdf_url' });

  if (error) {
    console.error(`  ✗ Upload error:`, error);
    console.log(`\n≡ƒôè Upload Summary - Successfully uploaded: 0/${uploadBooks.length}`);
  } else {
    console.log(`\n≡ƒôè Upload Summary - Successfully uploaded: ${uploadBooks.length}/${uploadBooks.length}`);
    console.log(`Skipped: ${books.length - uploadBooks.length} (no valid PDF URL)`);
  }
}

async function main() {
  console.log(`\n🔖 Scraping books for: مولانا محمد اسحاق ملتانی`);
  const books = await scrapeAll();
  
  if (books.length > 0) {
    console.log(`\nΓ£à Total books extracted: ${books.length}\n`);
    books.forEach(book => {
      console.log(`  Γ£ô ${book.title}`);
    });
    await uploadToSupabase(books);
  } else {
    console.log('No books found to scrape.');
  }
}

main().catch(console.error);
