import { supabase } from '../src/supabaseClient.js';

async function testInsert() {
  const testBook = {
    title: 'Test Book ' + Date.now(),
    category: 'نماز',
    pdf_url: 'https://test.com/' + Date.now() + '.pdf'
  };
  const { data, error } = await supabase.from('Books').insert([testBook]);
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted test book.');
  }
  process.exit(0);
}

testInsert();
