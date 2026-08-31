import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkEncAll() {
  const allBooks = [];
  let from = 0;
  const step = 999;
  while (true) {
    const { data, error } = await supabase.from('Books').select('title, category').eq('category', 'دائرۃ المعارف').range(from, from + step);
    if (error || !data || data.length === 0) break;
    allBooks.push(...data);
    from += step + 1;
  }
  
  let out = `Count: ${allBooks.length}\n`;
  allBooks.forEach(b => out += `${b.title}\n`);
  fs.writeFileSync('tmp/enc_all_final.txt', out);
  process.exit(0);
}

checkEncAll();
