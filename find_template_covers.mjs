import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTemplateCovers() {
  try {
    const { data: books, error } = await supabase
      .from('Books')
      .select('id, title, author, category, cover_url')
      .neq('cover_url', null);

    if (error) throw error;

    // Template cover patterns
    const templatePatterns = [
      'placeholder',
      'template',
      'default',
      'generic',
      'no-cover',
      'nocoverimage',
      'assets/images/default',
      '/default-',
      'missing-cover'
    ];

    const templateBooks = books.filter(book => {
      if (!book.cover_url) return false;
      const url = book.cover_url.toLowerCase();
      return templatePatterns.some(pattern => url.includes(pattern));
    });

    console.log(`\n📊 Template Cover Analysis:`);
    console.log(`Total Books: ${books.length}`);
    console.log(`Books with Template Covers: ${templateBooks.length}`);
    console.log(`Books with Real Covers: ${books.length - templateBooks.length}`);
    console.log(`Percentage with Real Covers: ${((books.length - templateBooks.length) / books.length * 100).toFixed(2)}%\n`);

    if (templateBooks.length > 0) {
      console.log(`📋 Template Cover Books:\n`);
      templateBooks.slice(0, 20).forEach((book, idx) => {
        console.log(`${idx + 1}. ${book.title}`);
        console.log(`   Author: ${book.author}`);
        console.log(`   Category: ${book.category}`);
        console.log(`   URL: ${book.cover_url.substring(0, 80)}...`);
        console.log();
      });

      if (templateBooks.length > 20) {
        console.log(`... and ${templateBooks.length - 20} more template cover books`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

findTemplateCovers();
