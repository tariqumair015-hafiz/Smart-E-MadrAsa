import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCompleteApp() {
  try {
    console.log('\n📚 COMPLETE APP DATABASE ANALYSIS (ALL BOOKS)\n');
    console.log('═'.repeat(70));

    // Get ALL books from Books table - no filters
    const { data: allBooks, error, count } = await supabase
      .from('Books')
      .select('id, title, cover_url, category, sub_category', { count: 'exact' });

    if (error) {
      console.error('Error:', error);
      return;
    }

    const totalBooks = allBooks.length;
    
    console.log(`\n\n📊 TOTAL BOOKS IN APP: ${totalBooks}`);
    console.log(`(یہ پوری app کی تمام کتابیں ہیں - کوئی limit نہیں)`);

    // Analyze covers
    const booksWithCover = allBooks.filter(b => b.cover_url && b.cover_url.trim() !== '');
    const booksWithoutCover = allBooks.filter(b => !b.cover_url || b.cover_url.trim() === '');

    console.log('\n' + '═'.repeat(70));
    console.log('\n📖 COVER IMAGE STATUS:\n');
    console.log(`✅ Books WITH actual covers: ${booksWithCover.length} (${((booksWithCover.length/totalBooks)*100).toFixed(2)}%)`);
    console.log(`❌ Books WITHOUT covers: ${booksWithoutCover.length} (${((booksWithoutCover.length/totalBooks)*100).toFixed(2)}%)`);

    // Category breakdown
    console.log('\n' + '═'.repeat(70));
    console.log('\n📚 BOOKS BY CATEGORY:\n');

    const byCategory = {};
    allBooks.forEach(book => {
      const cat = book.category || 'No Category';
      if (!byCategory[cat]) {
        byCategory[cat] = {
          total: 0,
          withCover: 0,
          withoutCover: 0
        };
      }
      byCategory[cat].total++;
      if (book.cover_url && book.cover_url.trim() !== '') {
        byCategory[cat].withCover++;
      } else {
        byCategory[cat].withoutCover++;
      }
    });

    const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);

    sortedCategories.forEach(([category, stats]) => {
      const percentage = ((stats.withCover / stats.total) * 100).toFixed(2);
      const status = stats.withoutCover === 0 ? '✅' : '⚠️';
      console.log(`${status} ${category}: ${stats.total} books`);
      console.log(`   ├─ With covers: ${stats.withCover}`);
      console.log(`   └─ Without covers: ${stats.withoutCover}\n`);
    });

    // Detailed books without covers
    if (booksWithoutCover.length > 0) {
      console.log('\n' + '═'.repeat(70));
      console.log('\n❌ DETAILED LIST - BOOKS WITHOUT COVERS:\n');

      const missingByCategory = {};
      booksWithoutCover.forEach(book => {
        const cat = book.category || 'No Category';
        const subCat = book.sub_category || 'Unknown';
        const key = `${cat} → ${subCat}`;
        
        if (!missingByCategory[key]) {
          missingByCategory[key] = [];
        }
        missingByCategory[key].push(book.title);
      });

      Object.entries(missingByCategory).forEach(([path, books]) => {
        console.log(`\n📖 ${path}: ${books.length} books`);
        books.forEach((title, idx) => {
          console.log(`   ${idx + 1}. ${title}`);
        });
      });
    }

    console.log('\n' + '═'.repeat(70) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkCompleteApp().catch(console.error);
