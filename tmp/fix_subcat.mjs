import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('Books')
    .update({ sub_category: 'اردو شروحات' })
    .eq('category', 'ثانویہ خاصہ سال اول')
    .eq('sub_category', 'شروحات');

  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated 'شروحات' to 'اردو شروحات'");
  }
}

run();
