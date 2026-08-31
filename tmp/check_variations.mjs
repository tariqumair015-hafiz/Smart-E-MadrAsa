import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkVariations() {
  const { data, error } = await supabase.from('Books').select('category');
  if (error) {
    fs.writeFileSync('tmp/variations.txt', 'Error: ' + JSON.stringify(error));
  } else {
    const counts = {};
    data?.forEach(b => {
      if (b.category.includes('معارف')) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    fs.writeFileSync('tmp/variations.txt', JSON.stringify(counts, null, 2));
  }
  process.exit(0);
}

checkVariations();
