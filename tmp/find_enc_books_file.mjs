import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function findEncToFile() {
  const { data, error } = await supabase.from('Books').select('title, category').ilike('title', '%انسائیکلوپیڈیا%');
  if (error) {
    fs.writeFileSync('tmp/find_enc_out.txt', 'Error: ' + error.message);
  } else {
    let out = '';
    data?.forEach(b => out += `'${b.title}' - Category: '${b.category}'\n`);
    fs.writeFileSync('tmp/find_enc_out.txt', out);
  }
  process.exit(0);
}

findEncToFile();
