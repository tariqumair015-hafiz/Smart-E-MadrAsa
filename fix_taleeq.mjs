import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');
const {error} = await sb.from('Books')
  .update({cover_url: 'https://besturdubooks.net/wp-content/uploads/2024/05/Al_Taleeq_ul_Faseeh.jpg'})
  .eq('category', 'درجہ سادسہ')
  .ilike('title', '%Taleeq%');
console.log(error ? 'ERR: ' + error.message : 'Done - Al Taleeq cover updated!');
