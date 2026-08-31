import { supabase } from '../src/supabaseClient.js';
import fs from 'fs';

async function checkRecentToFile() {
  const { data, error } = await supabase.from('Books').select('category');
  if (error) {
    fs.writeFileSync('tmp/cat_output.txt', 'Error: ' + error.message);
  } else {
    const counts = {};
    data.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    let output = 'Category counts in DB:\n';
    for (const [cat, count] of Object.entries(counts)) {
      output += `${cat}: ${count}\n`;
    }
    fs.writeFileSync('tmp/cat_output.txt', output);
  }
  process.exit(0);
}

checkRecentToFile();
