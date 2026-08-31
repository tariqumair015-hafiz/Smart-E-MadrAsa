import { supabase } from '../src/supabaseClient.js';

async function checkEnc() {
  const { data, count, error } = await supabase.from('Books').select('id, title, category', { count: 'exact' }).eq('category', 'دائرۃ المعارف');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Count:', count);
    if (data && data.length > 0) {
      console.log('Sample title:', data[0].title);
      console.log('Category:', data[0].category);
    }
  }
  process.exit(0);
}

checkEnc();
