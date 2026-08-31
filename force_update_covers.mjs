import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function extractIdentifier(url) {
  if (!url || !url.includes('archive.org')) return null;
  let match = url.match(/archive\.org\/(?:details|stream|download)\/([^\/]+)/);
  return match ? match[1] : null;
}

async function forceUpdateCovers() {
  try {
    console.log('\n🔍 Force updating covers from Archive.org...\n');

    // Get ALL Ishaq Multani books
    const { data: books } = await supabase
      .from('Books')
      .select('id, title, cover_url, pdf_url')
      .eq('sub_category', 'muhammad-ishaq-multani');

    console.log(`📚 Found ${books.length} books\n`);

    let updated = 0;
    let skipped = 0;

    for (const book of books) {
      if (book.pdf_url?.includes('archive.org')) {
        const identifier = extractIdentifier(book.pdf_url);
        
        if (identifier) {
          const coverUrl = `https://archive.org/services/img/${identifier}`;
          
          // Check if cover already set
          if (book.cover_url === coverUrl) {
            console.log(`[~] ${book.title} - Already has correct cover`);
            continue;
          }
          
          console.log(`[+] ${book.title}`);
          console.log(`    Setting: ${coverUrl}`);

          const { error } = await supabase
            .from('Books')
            .update({ cover_url: coverUrl })
            .eq('id', book.id);

          if (error) {
            console.log(`    ❌ Error: ${error.message}\n`);
            skipped++;
          } else {
            console.log(`    ✅ Updated!\n`);
            updated++;
          }
        } else {
          console.log(`[-] ${book.title} - Could not extract ID\n`);
          skipped++;
        }
      } else {
        console.log(`[-] ${book.title} - Not Archive.org\n`);
        skipped++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`\n✅ Updated: ${updated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
  }
}

forceUpdateCovers().catch(console.error);
