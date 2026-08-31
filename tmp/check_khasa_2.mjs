import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, sub_category')
    .eq('category', 'ثانویہ خاصہ سال دوم');

  if (error) {
    console.error("Error fetching books:", error);
    return;
  }
  
  console.log(`Found ${data.length} books in Khasa Banat Second Year`);
  console.log("Subcategories breakdown:");
  const breakdown = {};
  data.forEach(b => breakdown[b.sub_category] = (breakdown[b.sub_category] || 0) + 1);
  console.log(breakdown);
}

check();
