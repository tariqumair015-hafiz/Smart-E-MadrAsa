import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkExternal() {
  const { data, error } = await supabase.from('Books').select('cover_url');
  if (error) return;
  const external = data.filter(b => b.cover_url && !b.cover_url.includes('supabase.co'));
  console.log('--- External Cover URLs (not on Supabase) ---');
  console.log('Count:', external.length);
  external.slice(0, 10).forEach(e => console.log(e.cover_url));
}

checkExternal();
