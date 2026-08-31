import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const { data, error } = await supabase.from('Books').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Table is empty or no columns found.');
  }
}

checkColumns();
