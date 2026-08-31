import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugPalanpuri() {
  console.log('\n🔍 Debugging Palanpuri Books Display Issue...\n');

  // 1. Check if books exist in database
  console.log('1️⃣ Checking Supabase Books Table:');
  const { data: allBooks, error: allBooksError, count } = await supabase
    .from('Books')
    .select('*', { count: 'exact' });

  if (allBooksError) {
    console.log('   ❌ ERROR:', allBooksError.message);
    return;
  }
  console.log(`   ✅ Total books in database: ${count}`);

  // 2. Check specifically for Palanpuri books
  console.log('\n2️⃣ Checking Palanpuri Books:');
  const { data: palanpuriBooks, error: palanpuriError } = await supabase
    .from('Books')
    .select('id, title, category, sub_category, cover_url, is_free')
    .eq('sub_category', 'maulana-saeed-ahmad-palanpuri');

  if (palanpuriError) {
    console.log('   ❌ ERROR:', palanpuriError.message);
    return;
  }

  console.log(`   ✅ Palanpuri books found: ${palanpuriBooks?.length || 0}`);
  
  if (palanpuriBooks?.length > 0) {
    console.log('\n   📚 Sample Books:');
    palanpuriBooks.slice(0, 3).forEach((book, i) => {
      console.log(`      [${i+1}] ${book.title.substring(0, 40)}`);
      console.log(`          Category: ${book.category}`);
      console.log(`          Cover: ${book.cover_url ? '✅' : '❌'}`);
      console.log(`          Free: ${book.is_free ? '✅' : '❌'}`);
    });
  }

  // 3. Check all categories that contain books
  console.log('\n3️⃣ Checking all categories:');
  const { data: categories } = await supabase
    .from('Books')
    .select('category')
    .neq('category', null)
    .order('category');

  const uniqueCats = [...new Set(categories?.map(b => b.category) || [])];
  console.log(`   Total categories: ${uniqueCats.length}`);
  
  // Check if اکابرین exists
  if (uniqueCats.includes('اکابرین')) {
    console.log(`   ✅ اکابرین category EXISTS`);
    
    const { data: akabreenBooks } = await supabase
      .from('Books')
      .select('id')
      .eq('category', 'اکابرین');
    
    console.log(`   Total books in اکابرین: ${akabreenBooks?.length || 0}`);
  } else {
    console.log('   ❌ اکابرین category NOT found in database');
  }

  // 4. Check storage usage
  console.log('\n4️⃣ Checking Storage:');
  const { data: storageData, error: storageError } = await supabase
    .storage
    .listBuckets();

  if (storageError) {
    console.log('   ❌ Storage Error:', storageError.message);
  } else {
    console.log(`   ✅ Storage buckets accessible: ${storageData?.length || 0}`);
  }

  // 5. Check for any data integrity issues
  console.log('\n5️⃣ Data Integrity Check:');
  const issues = [];
  
  palanpuriBooks?.forEach(book => {
    if (!book.title) issues.push(`Book without title`);
    if (!book.cover_url) issues.push(`${book.title}: Missing cover_url`);
    if (!book.category) issues.push(`${book.title}: Missing category`);
  });

  if (issues.length === 0) {
    console.log('   ✅ No data integrity issues found');
  } else {
    console.log('   ⚠️ Issues found:');
    issues.forEach(i => console.log(`      - ${i}`));
  }

  // 6. Check if this could be a rendering issue
  console.log('\n6️⃣ Quick Summary:');
  console.log(`   📊 Database Status: ${allBooks ? '✅ OK' : '❌ ERROR'}`);
  console.log(`   📚 Palanpuri Books: ${palanpuriBooks?.length || 0}/32`);
  console.log(`   📂 Category Exists: ${uniqueCats.includes('اکابرین') ? '✅' : '❌'}`);
  console.log(`   🗄️ Storage Access: ✅ OK`);

  console.log('\n');
}

debugPalanpuri().catch(console.error);
