import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkAll() {
  const { data, error } = await supabase.from('Books').select('category');
  if (error) {
    fs.writeFileSync('tmp/all_cats.txt', 'Error: ' + JSON.stringify(error));
  } else {
    const counts = {};
    data?.forEach(b => counts[b.category] = (counts[b.category] || 0) + 1);
    fs.writeFileSync('tmp/all_cats.txt', JSON.stringify(counts, null, 2));
  }
  process.exit(0);
}

checkAll();
