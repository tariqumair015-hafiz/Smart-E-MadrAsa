import { supabase } from '../src/supabaseClient.js';

async function findMishkatAndJalalain() {
  const { data: mishkat } = await supabase.from('Books').select('category', { count: 'exact' }).ilike('title', '%مشکوٰۃ%');
  const { data: jalalain } = await supabase.from('Books').select('category', { count: 'exact' }).ilike('title', '%جلالین%');
  
  const mCats = {};
  mishkat?.forEach(b => mCats[b.category] = (mCats[b.category] || 0) + 1);
  const jCats = {};
  jalalain?.forEach(b => jCats[b.category] = (jCats[b.category] || 0) + 1);
  
  console.log('Mishkat book categories:', mCats);
  console.log('Jalalain book categories:', jCats);
  process.exit(0);
}

findMishkatAndJalalain();
