import { supabase } from '../src/supabaseClient.js';

async function findEnc() {
  const { data, error } = await supabase.from('Books').select('title, category').ilike('title', '%انسائیکلوپیڈیا%');
  if (error) {
    console.error('Error:', error);
  } else {
    data?.forEach(b => console.log(`'${b.title}' - Category: '${b.category}'`));
  }
  process.exit(0);
}

findEnc();
