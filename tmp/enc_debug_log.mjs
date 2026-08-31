import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkEncLog() {
  const { data, count, error } = await supabase.from('Books').select('id, title, category', { count: 'exact' }).eq('category', 'دائرۃ المعارف');
  if (error) {
    fs.writeFileSync('tmp/enc_debug_log.txt', 'Error: ' + JSON.stringify(error));
  } else {
    fs.writeFileSync('tmp/enc_debug_log.txt', `Count: ${count}\nData: ${JSON.stringify(data?.slice(0, 2))}`);
  }
  process.exit(0);
}

checkEncLog();
