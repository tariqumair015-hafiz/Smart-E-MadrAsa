import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllIshaqBooks() {
  try {
    console.log('\n🔍 Checking all Ishaq Multani books...\n');

    const { data: books, error } = await supabase
      .from('Books')
      .select('id, title, cover_url, pdf_url')
      .eq('sub_category', 'muhammad-ishaq-multani')
      .order('title');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📚 Total books: ${books.length}\n`);

    let withCovers = 0;
    let archiveNow = 0;
    let stillMissing = 0;

    const missingBooks = [];

    for (const book of books) {
      if (book.cover_url) {
        withCovers++;
        if (book.cover_url.includes('archive.org')) {
          archiveNow++;
        }
      } else {
        stillMissing++;
        missingBooks.push({
          title: book.title,
          pdf_url: book.pdf_url
        });
      }
    }

    console.log(`✅ Books with covers: ${withCovers}`);
    console.log(`📦 From Archive.org: ${archiveNow}`);
    console.log(`❌ Still missing: ${stillMissing}\n`);

    if (stillMissing > 0) {
      console.log('📝 Missing books:\n');
      for (const book of missingBooks) {
        console.log(`  • ${book.title}`);
        console.log(`    PDF: ${book.pdf_url || 'None'}\n`);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

checkAllIshaqBooks().catch(console.error);
