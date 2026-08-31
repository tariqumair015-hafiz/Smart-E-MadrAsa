import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function count7thTextbooks() {
  const { data, count, error } = await supabase
    .from('Books')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'درجہ سابعہ')
    .eq('sub_category', 'درسی کتب');

  console.log('Error:', error);
  console.log('Total 7th Year Textbooks count in DB:', count);
}

count7thTextbooks();
