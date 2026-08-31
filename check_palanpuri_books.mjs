import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');

async function check() {
  console.log('Checking Palanpuri books...\n');
  
  const { data } = await supabase
    .from('Books')
    .select('title, author, sub_category')
    .eq('author', 'Maulana Saeed Ahmad Palanpuri')
    .limit(5);
  
  if (data?.length > 0) {
    console.log('✅ Found books by author name:');
    data.forEach((b, i) => {
      console.log(`${i+1}. ${b.title.substring(0, 40)}`);
      console.log(`   Author: ${b.author}`);
      console.log(`   Sub-Category: ${b.sub_category}\n`);
    });
  } else {
    console.log('❌ No books found by author name\n');
  }
  
  // Also check by title containing "Palanpuri"
  const { data: titleData } = await supabase
    .from('Books')
    .select('title, sub_category, author')
    .ilike('title', '%Palanpuri%')
    .limit(5);
  
  if (titleData?.length > 0) {
    console.log('\n✅ Found books by title containing "Palanpuri":');
    titleData.forEach((b, i) => {
      console.log(`${i+1}. ${b.title.substring(0, 40)}`);
      console.log(`   Sub-Category: ${b.sub_category}\n`);
    });
  }
}

check().catch(console.error);
