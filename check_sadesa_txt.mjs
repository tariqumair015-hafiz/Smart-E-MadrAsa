import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const category = 'درجہ سادسہ';

async function check() {
  const { data, error } = await supabase.from('Books')
    .select('id, title, sub_category, cover_url')
    .eq('category', category)
    .eq('sub_category', 'درسی کتب')
    .order('title', { ascending: true });
    
  if (error) console.log(error);
  console.log(`Textbooks in 6th year (${data.length}):`);
  data.forEach(t => {
      const hasGoodCover = t.cover_url && !t.cover_url.includes('archive.org/services/img');
      console.log(`${hasGoodCover ? '✅' : '⚠️'} ${t.title}`);
  });
}
check();
