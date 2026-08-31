import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkYusuf() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, cover_url')
    .eq('sub_category', 'maulana-yusuf-ludhianvi');
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log('--- Maulana Yusuf Ludhianvi: Books & Covers ---');
  data.forEach(b => {
    console.log(`${b.title}: ${b.cover_url}`);
  });
}

checkYusuf();
