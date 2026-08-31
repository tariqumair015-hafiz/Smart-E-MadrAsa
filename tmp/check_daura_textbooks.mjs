import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDauraTextbooks() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, sub_category')
    .eq('category', 'دورہ حدیث')
    .eq('sub_category', 'درسی کتب');

  console.log('Error:', error);
  if (data) {
    console.log(`Total books: ${data.length}`);
    data.forEach(b => console.log(`- ${b.title}`));
  }
}

checkDauraTextbooks();
