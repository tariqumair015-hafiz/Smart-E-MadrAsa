import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, sub_category')
    .eq('category', 'عالمیہ بنات سال دوم');

  if (error) {
    console.error("Error fetching books:", error);
    return;
  }
  
  console.log(`Found ${data.length} books in Alamiyah Year 2`);
  const breakdown = {};
  data.forEach(b => breakdown[b.sub_category] = (breakdown[b.sub_category] || 0) + 1);
  console.log("Subcategories breakdown:", breakdown);
  
  console.log("Titles sample:");
  console.log(data.slice(0, 10).map(b => b.title));
}

check();
