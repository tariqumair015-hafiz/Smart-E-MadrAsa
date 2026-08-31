import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listNulls() {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title')
    .is('cover_url', null);
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`--- ${data.length} Books Missing Cover URL (NULL) ---`);
  data.forEach(b => console.log(`${b.id}: ${b.title}`));
}

listNulls();
