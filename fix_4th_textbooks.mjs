import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fix() {
  const urduIds = [19830, 19831, 19896];
  const arabicIds = [19862];

  for(const id of urduIds) {
    const {error} = await supabase.from('Books').update({sub_category: 'اردو شروحات'}).eq('id', id);
    if(error) console.log(error);
    else console.log(`Fixed ${id} -> اردو شروحات`);
  }

  for(const id of arabicIds) {
    const {error} = await supabase.from('Books').update({sub_category: 'عربی شروحات'}).eq('id', id);
    if(error) console.log(error);
    else console.log(`Fixed ${id} -> عربی شروحات`);
  }
}

fix();
