import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ftvnfgfptqjdwyshvhuw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0dm5mZ2ZwdHFqZHd5c2h2aHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NzAwODcsImV4cCI6MTcyOTg3ODA4N30.wKM0zcTb_84ZrSIrwIU5L_4nGzcSfBj2VfN5J1Ixlo4';
const supabase = createClient(supabaseUrl, supabaseKey);

const SCHOLAR = 'mufti-muhammad-shafi';

async function verify() {
  console.log(`\n🔍 Verifying cover images for ${SCHOLAR}...\n`);

  const { data, error } = await supabase
    .from('Books')
    .select('title, author, cover_url, pdf_url')
    .eq('sub_category', SCHOLAR);

  if (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }

  console.log(`📊 Total books in database: ${data.length}`);
  console.log('');

  let validCovers = 0;
  let missingCovers = [];

  data.forEach((book, index) => {
    const hasCover = book.cover_url && book.cover_url.trim() !== '';
    if (hasCover) {
      validCovers++;
      console.log(`✅ [${index + 1}/${data.length}] ${book.title}`);
    } else {
      missingCovers.push(book.title);
      console.log(`❌ [${index + 1}/${data.length}] ${book.title} - MISSING COVER`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Cover Validation Results:`);
  console.log(`   Valid covers: ${validCovers}/${data.length}`);
  console.log(`   Missing covers: ${missingCovers.length}`);

  if (missingCovers.length > 0) {
    console.log('\n⚠️  Books missing covers:');
    missingCovers.forEach(title => console.log(`   - ${title}`));
  } else {
    console.log('\n🎉 All books have valid cover images!');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

verify().catch(console.error);
