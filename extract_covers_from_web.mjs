import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extractCoverImages() {
  try {
    console.log('\n🔍 Extracting cover images for Ishaq Multani books...\n');

    // Get books without covers
    const { data: booksWithoutCovers } = await supabase
      .from('Books')
      .select('id, title, pdf_url, cover_url, sub_category')
      .eq('sub_category', 'muhammad-ishaq-multani')
      .or('cover_url.is.null,cover_url.eq.');

    console.log(`📚 Found ${booksWithoutCovers.length} books to process\n`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const updatedBooks = [];

    for (let i = 0; i < booksWithoutCovers.length; i++) {
      const book = booksWithoutCovers[i];
      console.log(`[${i + 1}/${booksWithoutCovers.length}] Processing: ${book.title}`);

      try {
        let coverUrl = '';

        // If book has pdf_url, try to extract cover from there
        if (book.pdf_url && book.pdf_url.includes('archive.org')) {
          try {
            await page.goto(book.pdf_url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Try to find cover image in archive.org viewer
            const cover = await page.evaluate(() => {
              // Method 1: Look for cover image in page
              let img = document.querySelector('img[src*="zipview"]');
              if (img) return img.src;

              // Method 2: Try to get from metadata
              img = document.querySelector('meta[property="og:image"]');
              if (img) return img.getAttribute('content');

              // Method 3: Look for any book preview image
              img = document.querySelector('img.page-image');
              if (img) return img.src;

              // Method 4: Extract from archive.org standard cover path
              const bookId = window.location.pathname.match(/\/details\/([^\/]+)/)?.[1];
              if (bookId) {
                return `https://archive.org/services/img/${bookId}`;
              }

              return '';
            });

            if (cover && cover.startsWith('http')) {
              coverUrl = cover;
              console.log(`   ✅ Found cover from archive.org`);
            }
          } catch (err) {
            console.log(`   ⚠️  Could not extract from archive.org: ${err.message}`);
          }
        }

        // If still no cover, try besturdubooks.net
        if (!coverUrl && book.title) {
          try {
            const searchUrl = `https://besturdubooks.net/?s=${encodeURIComponent(book.title)}`;
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

            const cover = await page.evaluate(() => {
              // Look for first book's image
              const img = document.querySelector('img.attachment-thumb');
              if (img) return img.getAttribute('src') || img.getAttribute('data-src');
              
              const thumb = document.querySelector('img[alt*="Book"]');
              if (thumb) return thumb.src;

              return '';
            });

            if (cover && cover.startsWith('http')) {
              coverUrl = cover;
              console.log(`   ✅ Found cover from besturdubooks.net`);
            }
          } catch (err) {
            console.log(`   ⚠️  Could not extract from besturdubooks: ${err.message}`);
          }
        }

        // Fallback: Use archive.org generic cover if we have the URL
        if (!coverUrl && book.pdf_url && book.pdf_url.includes('archive.org')) {
          const bookId = book.pdf_url.match(/\/details\/([^\/]+)/)?.[1];
          if (bookId) {
            coverUrl = `https://archive.org/services/img/${bookId}`;
            console.log(`   ✅ Using archive.org standard cover`);
          }
        }

        if (coverUrl) {
          updatedBooks.push({
            id: book.id,
            title: book.title,
            coverUrl
          });
        } else {
          console.log(`   ❌ Could not find cover image`);
        }

      } catch (error) {
        console.error(`   Error: ${error.message}`);
      }
    }

    await browser.close();

    // Update database
    console.log(`\n\n📤 Updating database with ${updatedBooks.length} cover images...\n`);

    for (const book of updatedBooks) {
      const { error } = await supabase
        .from('Books')
        .update({ cover_url: book.coverUrl })
        .eq('id', book.id);

      if (error) {
        console.log(`   ❌ ${book.title}: ${error.message}`);
      } else {
        console.log(`   ✅ ${book.title}`);
      }
    }

    console.log(`\n\n✅ Update complete! ${updatedBooks.length} books updated\n`);

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

extractCoverImages().catch(console.error);
