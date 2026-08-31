import { supabase } from '../src/supabaseClient.js';

async function checkNamaz() {
  const { data, error, count } = await supabase.from('Books').select('id, title', { count: 'exact' }).eq('category', 'نماز');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${count} namaz books in DB.`);
    console.log(`Data length: ${data?.length}`);
    if (data?.length > 0) {
      console.log('Sample book:', data[0].title);
    }
  }
  process.exit(0);
}

checkNamaz();
