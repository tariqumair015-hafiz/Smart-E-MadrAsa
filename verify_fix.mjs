import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');

async function testFix() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Scholar Profile Page Fix');
  console.log('='.repeat(60) + '\n');

  // Scholar ID from scholars.js
  const scholarId = 'maulana-saeed-ahmad-palanpuri';
  console.log(`🔍 Searching for books with scholarId: ${scholarId}\n`);

  // Simulate the exact query from ScholarProfilePage.jsx
  const { data, error } = await supabase
    .from('Books')
    .select('*')
    .ilike('sub_category', `%${scholarId}%`);

  if (error) {
    console.log('❌ Query Error:', error.message);
    return;
  }

  console.log(`✅ Books Found: ${data?.length || 0}\n`);

  if (data && data.length > 0) {
    console.log('📚 Sample Books:');
    data.slice(0, 5).forEach((book, i) => {
      console.log(`${i+1}. ${book.title.substring(0, 50)}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Sub-Category: ${book.sub_category}`);
      console.log(`   Cover: ${book.cover_url ? '✅' : '❌'}\n`);
    });

    if (data.length > 5) {
      console.log(`... اور ${data.length - 5} مزید کتابیں\n`);
    }

    console.log('='.repeat(60));
    console.log('✅ FIX VERIFIED! Books will now show in profile page');
    console.log('='.repeat(60) + '\n');
  } else {
    console.log('❌ NO BOOKS FOUND - Fix may not be working');
  }
}

testFix().catch(console.error);
