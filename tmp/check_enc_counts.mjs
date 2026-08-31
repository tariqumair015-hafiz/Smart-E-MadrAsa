import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkEncCount() {
  const { count: c1 } = await supabase.from('Books').select('id', { count: 'exact', head: true }).eq('category', 'دائرۃ المعارف');
  const { count: c2 } = await supabase.from('Books').select('id', { count: 'exact', head: true }).eq('category', 'Encyclopedias');
  
  fs.writeFileSync('tmp/enc_counts_final.txt', `Urdu Count: ${c1}\nEn Count: ${c2}`);
  process.exit(0);
}

checkEncCount();
