import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listBooks(scholarId) {
  const { data, error } = await supabase
    .from('Books')
    .select('id,title,description,sub_category')
    .ilike('sub_category', `%${scholarId}%`);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(`Fetched ${data.length} books for ${scholarId}`);
  const groups = {};
  data.forEach(b => {
    const key = b.title.trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  const dup = Object.entries(groups).filter(([,arr]) => arr.length > 1);
  console.log('Duplicate titles in UI data:', dup.length);
  dup.forEach(([title, items]) => {
    console.log('---', title);
    items.forEach(i => console.log(` id:${i.id} sub:${i.sub_category}`));
  });
}

// Change the scholarId below to test
listBooks('maulana-saeed-palanpuri').catch(e => console.error(e));
