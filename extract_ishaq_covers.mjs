import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extractAndUpdateCovers() {
  try {
    console.log('\n🔍 Extracting cover images for Ishaq Multani books...\n');

    // Get all Ishaq Multani books without covers
    const { data: books, error } = await supabase
      .from('Books')
      .select('id, title, pdf_url')
      .eq('sub_category', 'muhammad-ishaq-multani')
      .or('cover_url.is.null,cover_url.eq.');

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    console.log(`📚 Found ${books.length} books without covers\n`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const coversFound = [];
    const coversNotFound = [];

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      console.log(`[${i + 1}/${books.length}] Processing: ${book.title}`);

      let coverUrl = '';

      // Try to extract from pdf_url (if it's from besturdubooks.net)
      if (book.pdf_url && book.pdf_url.includes('besturdubooks.net')) {
        const baseUrl = book.pdf_url.split('/').slice(0, 3).join('/') + book.pdf_url.split('/').slice(3, -1).join('/');
        
        try {
          await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(500);

          // Extract cover image
          coverUrl = await page.evaluate(() => {
            // Try multiple selectors for cover image
            let imgUrl = '';
            
            // Try featured image
            const featured = document.querySelector('img.wp-post-image');
            if (featured) {
              imgUrl = featured.getAttribute('src') || featured.getAttribute('data-lazy-src') || '';
            }

            // Try entry content image
            if (!imgUrl) {
              const contentImg = document.querySelector('.entry-content img');
              if (contentImg) {
                imgUrl = contentImg.getAttribute('src') || contentImg.getAttribute('data-lazy-src') || '';
              }
            }

            // Try any large image
            if (!imgUrl) {
              const allImgs = Array.from(document.querySelectorAll('img'));
              for (let img of allImgs) {
                const src = img.getAttribute('src') || img.getAttribute('data-lazy-src') || '';
                if (src && src.includes('bestur') && !src.includes('gravatar')) {
                  imgUrl = src;
                  break;
                }
              }
            }

            // Clean up URL
            if (imgUrl && imgUrl.includes('?')) {
              imgUrl = imgUrl.split('?')[0];
            }

            return imgUrl;
          });

          if (coverUrl) {
            console.log(`   ✅ Found cover image`);
            coversFound.push({ ...book, coverUrl });
          } else {
            console.log(`   ❌ No cover image found on page`);
            coversNotFound.push(book);
          }
        } catch (err) {
          console.log(`   ⚠️  Error accessing page: ${err.message}`);
          coversNotFound.push(book);
        }
      } else {
        coversNotFound.push(book);
      }

      // Rate limiting
      await page.waitForTimeout(300);
    }

    await browser.close();

    // Update database with found covers
    if (coversFound.length > 0) {
      console.log(`\n\n📤 Updating database with ${coversFound.length} cover images...\n`);

      for (const book of coversFound) {
        const { error: updateError } = await supabase
          .from('Books')
          .update({ cover_url: book.coverUrl })
          .eq('id', book.id);

        if (updateError) {
          console.log(`   ❌ Failed to update ${book.title}: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated: ${book.title}`);
        }
      }
    }

    console.log(`\n\n📊 SUMMARY:`);
    console.log(`✅ Covers found & updated: ${coversFound.length}`);
    console.log(`❌ Covers not found: ${coversNotFound.length}`);

    if (coversNotFound.length > 0) {
      console.log(`\n⚠️  Books still without covers:`);
      coversNotFound.slice(0, 10).forEach((book, idx) => {
        console.log(`   ${idx + 1}. ${book.title}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

extractAndUpdateCovers().catch(console.error);
