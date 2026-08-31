import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftvnfgfptqjdwyshvhuw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dm5mZ2ZwdHFqZHd5c2h2aHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NzAwODcsImV4cCI6MTcyOTg3ODA4N30.wKM0zcTb_84ZrSIrwIU5L_4nGzcSfBj2VfN5J1Ixlo4';
const supabase = createClient(supabaseUrl, supabaseKey);

const SCHOLAR_ID = 'mufti-muhammad-taqi-usmani';

async function finalCheck() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Final Check for Scholar: ${SCHOLAR_ID}`);
  console.log(`${'='.repeat(70)}\n`);

  // Test the profile page query (using ilike like the app does)
  const { data, error } = await supabase
    .from('Books')
    .select('*')
    .ilike('sub_category', `%${SCHOLAR_ID}%`);

  if (error) {
    console.error('❌ Query error:', error.message);
    process.exit(1);
  }

  console.log(`📊 Books returned by profile query: ${data.length}`);
  console.log('');

  let allValid = true;
  let stats = { withCover: 0, withPdf: 0, validBooks: 0 };

  data.forEach((book, i) => {
    const hasCover = book.cover_url && book.cover_url.trim() !== '';
    const hasPdf = book.pdf_url && book.pdf_url.trim() !== '';

    if (hasCover) stats.withCover++;
    if (hasPdf) stats.withPdf++;

    if (hasCover && hasPdf) {
      stats.validBooks++;
      console.log(`✅ [${i + 1}/${data.length}] ${book.title}`);
    } else {
      allValid = false;
      if (!hasCover) console.log(`❌ [${i + 1}/${data.length}] ${book.title} - NO COVER`);
      if (!hasPdf) console.log(`❌ [${i + 1}/${data.length}] ${book.title} - NO PDF`);
    }
  });

  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ Query Results:');
  console.log(`   Total books: ${data.length}`);
  console.log(`   With cover images: ${stats.withCover}/${data.length}`);
  console.log(`   With PDF URLs: ${stats.withPdf}/${data.length}`);
  console.log(`   Fully valid: ${stats.validBooks}/${data.length}`);

  if (allValid && data.length > 0) {
    console.log(`\n🎉 Profile page is ready! All ${data.length} books validated.`);
    console.log(`   Status: ✅ READY FOR DEPLOYMENT`);
  } else {
    console.log(`\n⚠️  Some issues found. See details above.`);
    process.exit(1);
  }

  console.log(`${'='.repeat(70)}\n`);
}

finalCheck().catch(console.error);
