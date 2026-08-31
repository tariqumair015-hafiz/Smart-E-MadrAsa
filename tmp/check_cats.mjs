import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data: allBooks, error: fetchError } = await supabase
    .from('Books')
    .select('id, category, title');

  if (fetchError) {
    console.error("Error fetching books:", fetchError);
    return;
  }

  const uniqueCategories = [...new Set(allBooks.map(b => b.category))];
  console.log("All categories in DB:");
  uniqueCategories.forEach(c => console.log(c));
}

run();
