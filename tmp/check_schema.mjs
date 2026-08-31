import { supabase } from '../src/supabaseClient.js';

async function checkSchema() {
  const { data, error } = await supabase.from('Books').select('*').limit(1);
  if (error) {
    console.error('Error fetching book:', error);
  } else if (data && data.length > 0) {
    console.log('Columns in Books table:', Object.keys(data[0]));
    console.log('Sample book data:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No books found in table.');
  }
  process.exit(0);
}

checkSchema();
