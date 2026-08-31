import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCoverUrls() {
  try {
    const { data: books, error } = await supabase
      .from('Books')
      .select('id, title, author, category, cover_url');

    if (error) throw error;

    // Analyze cover URL patterns
    const coverPatterns = {};
    const emptyCovers = [];
    const genericCovers = [];

    books.forEach(book => {
      if (!book.cover_url) {
        emptyCovers.push(book);
        return;
      }

      const url = book.cover_url;
      
      // Extract domain/source
      let source = 'unknown';
      if (url.includes('archive.org')) source = 'archive.org';
      else if (url.includes('besturdubooks')) source = 'besturdubooks.net';
      else if (url.includes('assets')) source = 'local assets';
      else if (url.includes('placeholder')) source = 'placeholder';
      else if (url.includes('default')) source = 'default';
      
      coverPatterns[source] = (coverPatterns[source] || 0) + 1;

      // Check for generic/placeholder covers
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('placeholder') || 
          lowerUrl.includes('generic') || 
          lowerUrl.includes('no-cover') ||
          lowerUrl.includes('default-cover') ||
          lowerUrl.includes('missing')) {
        genericCovers.push(book);
      }
    });

    console.log('\n📊 DETAILED COVER ANALYSIS\n');
    console.log(`Total Books: ${books.length}`);
    console.log(`Books with Empty Cover URL: ${emptyCovers.length}`);
    console.log(`Books with Potential Generic Covers: ${genericCovers.length}\n`);

    console.log('📈 Cover Sources Distribution:');
    Object.entries(coverPatterns).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} books (${(count/books.length*100).toFixed(2)}%)`);
    });

    if (genericCovers.length > 0) {
      console.log(`\n⚠️  Books with Potential Generic/Placeholder Covers:\n`);
      genericCovers.forEach(book => {
        console.log(`• ${book.title}`);
        console.log(`  Author: ${book.author}`);
        console.log(`  Cover URL: ${book.cover_url}`);
        console.log();
      });
    }

    if (emptyCovers.length > 0) {
      console.log(`\n❌ Books with Empty Cover URL:\n`);
      emptyCovers.slice(0, 10).forEach(book => {
        console.log(`• ${book.title} (${book.author})`);
      });
      if (emptyCovers.length > 10) {
        console.log(`... and ${emptyCovers.length - 10} more`);
      }
    }

    // Sample some actual cover URLs
    console.log('\n📷 Sample Cover URLs:\n');
    const samples = books.filter(b => b.cover_url).slice(0, 5);
    samples.forEach(book => {
      console.log(`${book.title}:`);
      console.log(`  ${book.cover_url}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeCoverUrls();
