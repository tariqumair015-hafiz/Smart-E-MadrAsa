import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkUrls() {
  const { data: books } = await supabase
    .from('Books')
    .select('title, pdf_url')
    .eq('sub_category', 'muhammad-ishaq-multani')
    .limit(5);

  console.log('\nSample PDF URLs:\n');
  books.forEach(b => {
    console.log(`${b.title}`);
    console.log(`URL: ${b.pdf_url}\n`);
  });
}

checkUrls();
