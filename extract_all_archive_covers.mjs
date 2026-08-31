import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function extractIdentifier(url) {
  if (!url || !url.includes('archive.org')) return null;

  // Handle different archive.org URL patterns:
  // https://archive.org/details/{identifier}
  // https://archive.org/stream/{identifier}/...
  // https://archive.org/download/{identifier}/...
  
  let match = url.match(/archive\.org\/(?:details|stream|download)\/([^\/]+)/);
  return match ? match[1] : null;
}

async function extractAllArchiveCovers() {
  try {
    console.log('\n🔍 Extracting cover images from all Archive.org URLs...\n');

    const { data: books, error } = await supabase
      .from('Books')
      .select('id, title, cover_url, pdf_url')
      .eq('sub_category', 'muhammad-ishaq-multani')
      .is('cover_url', null); // Only missing covers

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`📚 Found ${books.length} books without covers\n`);

    const coversAdded = [];
    const coversSkipped = [];
    const errors = [];

    for (const book of books) {
      if (book.pdf_url && book.pdf_url.includes('archive.org')) {
        const identifier = extractIdentifier(book.pdf_url);
        
        if (identifier) {
          const coverUrl = `https://archive.org/services/img/${identifier}`;
          
          console.log(`[+] ${book.title}`);
          console.log(`    ID: ${identifier}`);

          const { error: updateError } = await supabase
            .from('Books')
            .update({ cover_url: coverUrl })
            .eq('id', book.id);

          if (updateError) {
            console.log(`    ❌ Error: ${updateError.message}\n`);
            errors.push({ book, error: updateError.message });
          } else {
            console.log(`    ✅ Updated!\n`);
            coversAdded.push(book);
          }
        } else {
          console.log(`[-] ${book.title}\n    Could not extract identifier\n`);
          coversSkipped.push(book);
        }
      } else if (book.pdf_url) {
        console.log(`[-] ${book.title}\n    URL not from Archive.org\n`);
        coversSkipped.push(book);
      } else {
        console.log(`[-] ${book.title}\n    No PDF URL\n`);
        coversSkipped.push(book);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`✅ Covers added: ${coversAdded.length}`);
    console.log(`⚠️  Covers skipped: ${coversSkipped.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log('\n' + '═'.repeat(60) + '\n');

    if (errors.length > 0) {
      console.log('Errors:\n');
      for (const { book, error } of errors) {
        console.log(`  ${book.title}: ${error}`);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

extractAllArchiveCovers().catch(console.error);
