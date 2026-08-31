import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('title')
    .eq('category', 'عالمیہ بنات سال دوم')
    .ilike('cover_url', '%placeholder%');

  if (error) console.error(error);
  else {
    console.log(`Found ${data.length} books still without covers in Alamiyah Year 2:`);
    console.log(data.map(b => b.title));
  }
}

check();
