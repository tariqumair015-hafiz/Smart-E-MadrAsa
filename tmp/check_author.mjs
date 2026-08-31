import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, author, sub_category, cover_url')
    .eq('category', 'ثانویہ خاصہ سال اول');

  if (error) {
    console.error("Error fetching books:", error);
    return;
  }
  
  console.log(`Found ${data.length} books in Khasa Banat First Year`);
  console.log("Sample authors:");
  console.log(data.slice(0, 5).map(b => b.author));
}

check();
