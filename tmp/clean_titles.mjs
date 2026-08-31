import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const {data} = await supabase.from('Books').select('id, title').eq('sub_category', 'dr-mahmood-ahmad-ghazi');
  
  for (const b of data) {
      if (b.title.includes('ExpandExpand')) {
          let cleanTitle = b.title.split('ExpandExpand')[0].trim();
          console.log(`Fixing title ${b.id} to: ${cleanTitle}`);
          await supabase.from('Books').update({ title: cleanTitle }).eq('id', b.id);
      }
  }
}
run();
