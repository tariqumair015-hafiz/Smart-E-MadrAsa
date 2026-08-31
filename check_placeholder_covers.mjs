import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCoverQuality() {
  try {
    console.log('\n🔍 Checking cover image quality and placeholders...\n');

    // Fetch all books with cover_url
    const { data: allBooks, error } = await supabase
      .from('Books')
      .select('id, title, cover_url, author, sub_category')
      .not('cover_url', 'is', null);

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    const placeholderPatterns = [
      'placeholder',
      'default',
      'no-image',
      'icon',
      'dashed',
      'vacant',
      'empty',
      'generic',
      'template'
    ];

    const withActualCovers = [];
    const withPlaceholders = [];
    const emptyUrls = [];
    const invalidUrls = [];

    for (const book of allBooks) {
      const url = (book.cover_url || '').trim();

      // Empty check
      if (!url) {
        emptyUrls.push(book);
        continue;
      }

      // Check URL validity
      if (!url.startsWith('http')) {
        invalidUrls.push({ ...book, reason: 'Invalid URL format' });
        continue;
      }

      // Check for placeholder patterns in URL
      const isPlaceholder = placeholderPatterns.some(pattern =>
        url.toLowerCase().includes(pattern)
      );

      if (isPlaceholder) {
        withPlaceholders.push(book);
      } else {
        withActualCovers.push(book);
      }
    }

    console.log(`📊 COVER IMAGE ANALYSIS:\n`);
    console.log(`✅ Books with ACTUAL covers: ${withActualCovers.length}`);
    console.log(`⚠️  Books with PLACEHOLDER covers: ${withPlaceholders.length}`);
    console.log(`❌ Books with EMPTY URLs: ${emptyUrls.length}`);
    console.log(`🚫 Books with INVALID URLs: ${invalidUrls.length}`);
    console.log(`📈 Total books checked: ${allBooks.length}\n`);

    // Show placeholder books
    if (withPlaceholders.length > 0) {
      console.log('\n⚠️  BOOKS WITH PLACEHOLDER COVERS:\n');
      const placeholderByScholar = {};
      withPlaceholders.forEach(book => {
        const scholar = book.sub_category || 'Unknown';
        if (!placeholderByScholar[scholar]) {
          placeholderByScholar[scholar] = [];
        }
        placeholderByScholar[scholar].push(book);
      });

      Object.entries(placeholderByScholar).forEach(([scholar, books]) => {
        console.log(`\n📚 ${scholar}: ${books.length} books`);
        books.forEach((book, idx) => {
          console.log(`   ${idx + 1}. ${book.title}`);
          console.log(`      URL: ${book.cover_url.substring(0, 80)}...`);
        });
      });
    }

    // Show empty and invalid
    if (emptyUrls.length > 0) {
      console.log('\n\n❌ BOOKS WITH EMPTY COVER URLS: ' + emptyUrls.length);
    }

    if (invalidUrls.length > 0) {
      console.log('\n\n🚫 BOOKS WITH INVALID URLS: ' + invalidUrls.length);
      invalidUrls.slice(0, 5).forEach(book => {
        console.log(`   - ${book.title} (${book.reason})`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkCoverQuality().catch(console.error);
