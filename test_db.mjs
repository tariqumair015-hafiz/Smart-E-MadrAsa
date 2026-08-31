import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('Books')
    .select('title, sub_category, pdf_url')
    .eq('category', 'درجہ ثالثہ');
  if (error) console.log(error);
  console.log(`DB total: ${data.length}`);
  const txt = data.filter(d => d.sub_category === 'درسی کتب');
  console.log(`DB Textbooks (${txt.length}):`);
  txt.forEach(t => console.log(' - ' + t.title));
}
check();
