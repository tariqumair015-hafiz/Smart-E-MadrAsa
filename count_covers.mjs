import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function countCovers() {
  const { data, error, count } = await supabase
    .from('Books')
    .select('id', { count: 'exact', head: true })
    .neq('cover_url', null)
    .neq('cover_url', '');
  if (error) {
    console.error('Error fetching count:', error.message);
    return;
  }
  console.log('📚 Total books with a valid cover image:', count);
}

countCovers();
