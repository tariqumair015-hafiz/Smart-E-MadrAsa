import { supabase } from '../src/supabaseClient.js';

async function checkRoza() {
  const { data, error, count } = await supabase.from('Books').select('id, title', { count: 'exact' }).eq('category', 'روزہ');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${count} roza books in DB.`);
  }
  process.exit(0);
}

checkRoza();
