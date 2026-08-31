import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCats() {
  const { data, error } = await supabase
    .from('Books')
    .select('category')
    .ilike('category', '%عالمیہ%');

  if (error) console.error(error);
  else {
    const cats = [...new Set(data.map(d => d.category))];
    console.log("Categories in DB with 'عالمیہ':");
    console.log(cats);
  }
}

checkCats();
