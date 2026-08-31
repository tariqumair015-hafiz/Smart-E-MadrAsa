import { supabase } from '../src/supabaseClient.js';

async function findOne() {
  const { data, error } = await supabase.from('Books').select('title, category').ilike('title', '%خواتین کا فقہی انسائیکلوپیڈیا%');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(data);
  }
  process.exit(0);
}

findOne();
