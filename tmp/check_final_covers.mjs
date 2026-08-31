import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, cover_url')
    .eq('category', 'عالمیہ بنات سال دوم')
    .order('title', { ascending: true })
    .limit(20);

  if (error) console.error(error);
  else {
    data.forEach(b => {
      console.log(`${b.title}: ${b.cover_url}`);
    });
  }
}

check();
