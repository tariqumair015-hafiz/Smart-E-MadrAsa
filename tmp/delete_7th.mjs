import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  const { data, error } = await supabase
    .from('Books')
    .delete()
    .eq('category', 'درجہ سابعہ')
    .eq('sub_category', 'درسی کتب');

  console.log('Delete error:', error);
  console.log('Deleted successfully.');
}

clean();
