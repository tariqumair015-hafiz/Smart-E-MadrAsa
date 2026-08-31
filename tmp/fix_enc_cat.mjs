import { supabase } from '../src/supabaseClient.js';

async function fixEnc() {
  const { data, error } = await supabase.from('Books').select('id, title').ilike('title', '%انسائیکلوپیڈیا%');
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log(`Found ${data.length} books with Encyclopedia in title.`);
  
  for (const book of data) {
    const { error: updateError } = await supabase
      .from('Books')
      .update({ category: 'دائرۃ المعارف' })
      .eq('id', book.id);
      
    if (updateError) {
      console.error(`Error updating book ${book.title}:`, updateError);
    } else {
      console.log(`Updated: ${book.title}`);
    }
  }
  
  process.exit(0);
}

fixEnc();
