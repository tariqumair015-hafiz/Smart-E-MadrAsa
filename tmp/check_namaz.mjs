import { supabase } from '../src/supabaseClient.js';

async function checkNamaz() {
  const { data, error } = await supabase.from('Books').select('id, title, category').eq('category', 'نماز').limit(10);
  if (error) {
    console.error('Error fetching namaz books:', error);
  } else {
    console.log(`Found ${data.length} namaz books in DB.`);
    data.forEach(b => console.log(`- ${b.title}`));
  }
  process.exit(0);
}

checkNamaz();
