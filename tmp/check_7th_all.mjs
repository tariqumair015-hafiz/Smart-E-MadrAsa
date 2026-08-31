import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllCounts() {
  const categories = ['درسی کتب', 'اردو شروحات', 'عربی شروحات'];
  for (const sub of categories) {
    const { count, error } = await supabase
        .from('Books')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'درجہ سابعہ')
        .eq('sub_category', sub);
    console.log(`${sub}: ${count}`);
  }
}
checkAllCounts();
