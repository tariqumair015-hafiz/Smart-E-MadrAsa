import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');

(async () => {
  console.log('📋 Verifying Zakariyya Kandhelvi books upload...\n');

  const { data, error } = await supabase
    .from('Books')
    .select('title, author, cover_url, pdf_url')
    .eq('sub_category', 'maulana-zakariyya-kandhelvi');

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`✅ Found ${data.length} books in database\n`);

  let validCovers = 0;
  let invalidCovers = 0;

  data.forEach((book, idx) => {
    const hasValidCover = book.cover_url && book.cover_url.trim() !== '';
    if (hasValidCover) {
      validCovers++;
      console.log(`✓ [${idx + 1}/${data.length}] ${book.title}`);
    } else {
      invalidCovers++;
      console.log(`✗ [${idx + 1}/${data.length}] ${book.title} - MISSING COVER`);
    }
  });

  console.log(`\n📊 Cover Validation:`);
  console.log(`   Valid covers: ${validCovers}/${data.length}`);
  console.log(`   Missing covers: ${invalidCovers}/${data.length}`);

  if (invalidCovers > 0) {
    console.log(`\n⚠️  WARNING: ${invalidCovers} book(s) have missing covers!`);
  } else {
    console.log(`\n✅ ALL BOOKS VERIFIED SUCCESSFULLY - 100% covers present`);
  }
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
