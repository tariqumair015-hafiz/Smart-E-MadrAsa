import { supabase } from '../src/supabaseClient.js';

async function checkBook() {
  const { data, error } = await supabase.from('Books').select('id, title, category').ilike('title', '%Daleel e Namaz%');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Book found:', data);
  }
  process.exit(0);
}

checkBook();
