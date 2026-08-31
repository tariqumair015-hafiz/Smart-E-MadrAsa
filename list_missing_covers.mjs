import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listMissingCovers() {
  const { data, error, count } = await supabase
    .from('Books')
    .select('id, title, cover_url', { count: 'exact' })
    .or('cover_url.is.null,cover_url.eq.')
    .limit(1000); // fetch up to 1000 for inspection

  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('📚 Total books missing cover:', count);
  data.forEach(b => {
    console.log(`- ${b.id}: ${b.title}`);
  });
}

listMissingCovers();
