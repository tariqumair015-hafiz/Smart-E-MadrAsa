import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMissingCovers() {
  try {
    console.log('\n🔍 Checking for missing cover images in database...\n');

    // Fetch all books
    const { data: allBooks, error } = await supabase
      .from('Books')
      .select('id, title, cover_url, author, sub_category');

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    if (!allBooks || allBooks.length === 0) {
      console.log('No books found in database');
      return;
    }

    const missingCoverBooks = [];
    const withCoverBooks = [];

    allBooks.forEach(book => {
      if (!book.cover_url || book.cover_url.trim() === '') {
        missingCoverBooks.push(book);
      } else {
        withCoverBooks.push(book);
      }
    });

    console.log(`📊 TOTAL BOOKS: ${allBooks.length}`);
    console.log(`✅ Books WITH cover images: ${withCoverBooks.length}`);
    console.log(`❌ Books WITHOUT cover images: ${missingCoverBooks.length}`);
    console.log(`📈 Coverage: ${((withCoverBooks.length / allBooks.length) * 100).toFixed(2)}%\n`);

    // Group missing covers by scholar
    const missingByScholar = {};
    missingCoverBooks.forEach(book => {
      const scholar = book.sub_category || 'Unknown';
      if (!missingByScholar[scholar]) {
        missingByScholar[scholar] = [];
      }
      missingByScholar[scholar].push(book);
    });

    if (missingCoverBooks.length > 0) {
      console.log('\n❌ BOOKS WITHOUT COVER IMAGES:\n');
      Object.entries(missingByScholar).forEach(([scholar, books]) => {
        console.log(`\n📚 ${scholar}: ${books.length} books`);
        books.forEach((book, idx) => {
          console.log(`   ${idx + 1}. ${book.title}`);
        });
      });
    }

    console.log('\n\n✅ COVERAGE BY SCHOLAR:\n');
    const scholarStats = {};
    allBooks.forEach(book => {
      const scholar = book.sub_category || 'Unknown';
      if (!scholarStats[scholar]) {
        scholarStats[scholar] = { total: 0, withCover: 0 };
      }
      scholarStats[scholar].total++;
      if (book.cover_url && book.cover_url.trim() !== '') {
        scholarStats[scholar].withCover++;
      }
    });

    Object.entries(scholarStats).forEach(([scholar, stats]) => {
      const percentage = ((stats.withCover / stats.total) * 100).toFixed(2);
      const status = stats.withCover === stats.total ? '✅' : '⚠️';
      console.log(`${status} ${scholar}: ${stats.withCover}/${stats.total} (${percentage}%)`);
    });

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkMissingCovers().catch(console.error);
