import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTotalBooks() {
  try {
    console.log('\n📚 COMPLETE BOOK DATABASE ANALYSIS\n');
    console.log('═'.repeat(60));

    // Get all books (no limit)
    const { data: allBooks, error } = await supabase
      .from('Books')
      .select('id, title, cover_url, author, sub_category', { count: 'exact' });

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }

    const totalBooks = allBooks.length;
    
    console.log(`\n📊 TOTAL BOOKS IN DATABASE: ${totalBooks}\n`);

    if (totalBooks > 3000) {
      console.log(`✅ YES! App میں 3000 سے زیادہ کتابیں ہیں!\n`);
    } else {
      console.log(`ℹ️  App میں کل ${totalBooks} کتابیں ہیں (3000 سے کم)\n`);
    }

    // Analyze covers
    const booksWithCover = allBooks.filter(b => b.cover_url && b.cover_url.trim() !== '');
    const booksWithoutCover = allBooks.filter(b => !b.cover_url || b.cover_url.trim() === '');

    console.log('═'.repeat(60));
    console.log('\n📖 COVER IMAGE STATUS:\n');
    console.log(`✅ کتابیں جن کے پاس ACTUAL Cover ہے: ${booksWithCover.length} (${((booksWithCover.length/totalBooks)*100).toFixed(2)}%)`);
    console.log(`❌ کتابیں جن کے پاس COVER نہیں ہے: ${booksWithoutCover.length} (${((booksWithoutCover.length/totalBooks)*100).toFixed(2)}%)`);

    console.log('\n═'.repeat(60));
    console.log('\n📚 BOOKS WITHOUT COVERS - تفصیل:\n');

    // Group by scholar
    const missingByScholar = {};
    booksWithoutCover.forEach(book => {
      const scholar = book.sub_category || 'Unknown';
      if (!missingByScholar[scholar]) {
        missingByScholar[scholar] = {
          count: 0,
          books: []
        };
      }
      missingByScholar[scholar].count++;
      missingByScholar[scholar].books.push(book.title);
    });

    // Sort by count
    const sortedScholars = Object.entries(missingByScholar).sort((a, b) => b[1].count - a[1].count);

    sortedScholars.forEach(([scholar, data]) => {
      console.log(`\n📖 ${scholar}: ${data.count} books بغیر cover`);
      if (data.count <= 5) {
        data.books.forEach((title, i) => {
          console.log(`   ${i + 1}. ${title}`);
        });
      } else {
        data.books.slice(0, 3).forEach((title, i) => {
          console.log(`   ${i + 1}. ${title}`);
        });
        console.log(`   ... اور ${data.count - 3} مزید`);
      }
    });

    console.log('\n═'.repeat(60));
    console.log('\n✅ SCHOLARS WITH 100% COVERS:\n');

    // Get scholars with all covers
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

    const perfectScholars = Object.entries(scholarStats).filter(([_, stats]) => stats.withCover === stats.total);
    
    if (perfectScholars.length > 0) {
      console.log(`\n✅ ${perfectScholars.length} Scholars کے تمام books کے پاس معیاری covers ہیں:\n`);
      perfectScholars.forEach(([scholar, stats]) => {
        console.log(`   ✅ ${scholar} (${stats.total} books)`);
      });
    }

    console.log('\n═'.repeat(60) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkTotalBooks().catch(console.error);
