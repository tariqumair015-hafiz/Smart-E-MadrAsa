import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkEnc() {
  const { data, count, error } = await supabase.from('Books').select('title, category', { count: 'exact' }).eq('category', 'دائرۃ المعارف');
  if (error) {
    fs.writeFileSync('tmp/enc_debug.txt', 'Error: ' + error.message);
  } else {
    let res = `Count: ${count}\n`;
    data?.forEach(b => res += `'${b.title}'\n`);
    fs.writeFileSync('tmp/enc_debug.txt', res);
  }
  process.exit(0);
}

checkEnc();
