import { supabase } from '../src/supabaseClient.js';

async function findMishkat() {
  const { data: mishkat } = await supabase.from('Books').select('title, category').ilike('title', '%Mishkat%');
  const mCats = {};
  mishkat?.forEach(b => mCats[b.category] = (mCats[b.category] || 0) + 1);
  console.log('Mishkat categories found:', mCats);
  if (mishkat?.length > 0) console.log('Sample title:', mishkat[0].title);
  process.exit(0);
}

findMishkat();
