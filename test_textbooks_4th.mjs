import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('Books')
    .select('id, title, sub_category')
    .eq('category', 'درجہ رابعہ')
    .eq('sub_category', 'درسی کتب');
    
  if (error) console.log(error);
  console.log(`DB Textbooks in 4th year (${data.length}):`);
  data.forEach(t => console.log(`[${t.id}] ` + t.title));
}
check();
