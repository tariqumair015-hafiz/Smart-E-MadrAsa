import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, sub_category')
    .eq('category', 'عالیہ بنات سال دوم');

  if (error) {
    console.error("Error fetching books:", error);
    return;
  }
  
  console.log(`Found ${data.length} books in Aliya Year 2`);
  const breakdown = {};
  data.forEach(b => breakdown[b.sub_category] = (breakdown[b.sub_category] || 0) + 1);
  console.log("Subcategories breakdown:", breakdown);
  
  const sample = data.map(b => b.title).slice(0, 5);
  console.log("Sample titles:", sample);
}

check();
