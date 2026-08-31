import { supabase } from '../src/supabaseClient.js';

async function checkRecent() {
  const { data, error } = await supabase.from('Books').select('category');
  if (error) {
    console.error('Error:', error);
  } else {
    const counts = {};
    data.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    console.log('Category counts in DB:');
    for (const [cat, count] of Object.entries(counts)) {
      console.log(`${cat}: ${count}`);
    }
  }
  process.exit(0);
}

checkRecent();
