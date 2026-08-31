import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ymizqgtlnhvkqlidftiy.supabase.co',
  'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'
);

console.log('Deleting all 7th year (درجہ سابعہ) books...');
const { error } = await supabase.from('Books').delete().eq('category', 'درجہ سابعہ');
if (error) {
  console.error('Error:', error.message);
} else {
  console.log('✅ Done! All 7th year books deleted.');
}
