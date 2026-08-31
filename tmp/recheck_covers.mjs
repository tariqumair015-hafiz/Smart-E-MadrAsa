import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCovers() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, cover_url')
    .eq('category', 'درجہ اولیٰ')
    .eq('sub_category', 'درسی کتب');

  if (error) console.error(error);
  if (data) {
    const missing = data.filter(b => !b.cover_url || b.cover_url.trim() === '');
    console.log(`Total Books: ${data.length}`);
    console.log(`Missing Covers: ${missing.length}`);
    missing.forEach(b => console.log(`- ${b.title}`));
  }
}

checkCovers();
