import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCategories() {
  // Get Palanpuri books
  const { data } = await supabase
    .from('Books')
    .select('category, sub_category')
    .eq('sub_category', 'maulana-saeed-ahmad-palanpuri')
    .limit(1);

  if (data && data.length > 0) {
    console.log('✅ Palanpuri Books Category:', data[0].category);
    console.log('✅ Palanpuri Books Sub-Category:', data[0].sub_category);
  }

  // Get all distinct categories
  const { data: allBooks } = await supabase
    .from('Books')
    .select('category')
    .neq('category', null)
    .order('category');

  const categories = [...new Set(allBooks?.map(b => b.category) || [])];
  console.log('\n📚 All Categories in Database:');
  categories.forEach(cat => console.log(`  - ${cat}`));

  console.log('\n📊 Total unique categories:', categories.length);
}

checkCategories();
