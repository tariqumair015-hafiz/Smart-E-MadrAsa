import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, cover_url')
    .eq('category', 'عالمیہ بنات سال دوم')
    .ilike('title', '%انعامات المنعم%');

  if (error) console.error(error);
  else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
