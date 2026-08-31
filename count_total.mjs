import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function countBooks() {
  const { count, error } = await supabase
    .from('Books')
    .select('id', { count: 'exact', head: true });
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('📚 Total books in DB:', count);
}

countBooks();
