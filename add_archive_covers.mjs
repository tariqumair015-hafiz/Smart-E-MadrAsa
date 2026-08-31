import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function extractArchiveCovers() {
  try {
    console.log('\n🔍 Extracting cover images from Archive.org...\n');

    // Get all Ishaq Multani books
    const { data: books } = await supabase
      .from('Books')
      .select('id, title, pdf_url')
      .eq('sub_category', 'muhammad-ishaq-multani');

    console.log(`📚 Found ${books.length} books\n`);

    const coversAdded = [];
    const coversSkipped = [];

    for (const book of books) {
      // Check if it's an archive.org URL
      if (book.pdf_url && book.pdf_url.includes('archive.org')) {
        // Extract identifier from URL
        // URL format: https://archive.org/details/{identifier}
        const match = book.pdf_url.match(/archive\.org\/details\/([^\/]+)/);
        
        if (match) {
          const identifier = match[1];
          // Archive.org cover image URL pattern
          const coverUrl = `https://archive.org/services/img/${identifier}`;
          
          console.log(`[+] ${book.title}`);
          console.log(`    Identifier: ${identifier}`);
          console.log(`    Cover URL: ${coverUrl}`);

          // Update database
          const { error } = await supabase
            .from('Books')
            .update({ cover_url: coverUrl })
            .eq('id', book.id);

          if (error) {
            console.log(`    ❌ Error: ${error.message}\n`);
            coversSkipped.push(book);
          } else {
            console.log(`    ✅ Updated!\n`);
            coversAdded.push(book);
          }
        }
      } else if (book.pdf_url) {
        console.log(`[-] ${book.title}`);
        console.log(`    URL not from Archive.org: ${book.pdf_url}\n`);
        coversSkipped.push(book);
      } else {
        console.log(`[-] ${book.title} - No PDF URL\n`);
        coversSkipped.push(book);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Covers added from Archive.org: ${coversAdded.length}`);
    console.log(`⚠️  Covers skipped: ${coversSkipped.length}`);
    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

extractArchiveCovers().catch(console.error);
