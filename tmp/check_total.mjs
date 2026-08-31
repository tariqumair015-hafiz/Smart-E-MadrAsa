import { supabase } from '../src/supabaseClient.js';

async function checkAll() {
  const { data, error } = await supabase.from('Books').select('id', { count: 'exact' });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total books:', data.length);
  }
  process.exit(0);
}

checkAll();
