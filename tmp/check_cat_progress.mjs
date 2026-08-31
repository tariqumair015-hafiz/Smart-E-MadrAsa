import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAula() {
  const { data, error } = await supabase
    .from('Books')
    .select('title')
    .eq('category', 'درجہ اولیٰ')
    .eq('sub_category', 'درسی کتب')
    .order('title', { ascending: true });

  if (error) console.error(error);
  if (data) {
    console.log(`Total Aula Textbooks: ${data.length}`);
    data.forEach(b => console.log(`- ${b.title}`));
  }
}

checkAula();
