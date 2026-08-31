import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkAllLoop() {
  const allCats = [];
  let from = 0;
  const step = 999;
  while (true) {
    const { data, error } = await supabase.from('Books').select('category').range(from, from + step);
    if (error || !data || data.length === 0) break;
    data.forEach(b => allCats.push(b.category));
    from += step + 1;
  }
  
  const counts = {};
  allCats.forEach(c => counts[c] = (counts[c] || 0) + 1);
  fs.writeFileSync('tmp/all_cats_loop.txt', JSON.stringify(counts, null, 2));
  process.exit(0);
}

checkAllLoop();
