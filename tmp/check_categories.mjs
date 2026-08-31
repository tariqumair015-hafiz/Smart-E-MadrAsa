import { supabase } from '../src/supabaseClient.js';

async function checkCategories() {
  const { data, error } = await supabase.from('Books').select('category');
  if (error) {
    console.error('Error fetching categories:', error);
  } else {
    const counts = {};
    data.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    console.log('Category counts in DB:', counts);
  }
  process.exit(0);
}

checkCategories();
