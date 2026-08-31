import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deleteSaniaBooks() {
  // Step 1: Count before delete
  const { count, error: countError } = await supabase
    .from('Books')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'درجہ ثانیہ (2nd Year)');

  if (countError) {
    console.error('Error counting books:', countError.message);
    return;
  }

  console.log(`Found ${count} books in "درجہ ثانیہ (2nd Year)" (Boys - Dars-e-Nizami)`);

  if (count === 0) {
    console.log('No books found to delete.');
    return;
  }

  // Step 2: Delete all books with category = درجہ ثانیہ (2nd Year)
  const { error: deleteError } = await supabase
    .from('Books')
    .delete()
    .eq('category', 'درجہ ثانیہ (2nd Year)');

  if (deleteError) {
    console.error('Error deleting books:', deleteError.message);
    return;
  }

  console.log(`✅ Successfully deleted ${count} books from "درجہ ثانیہ (2nd Year)" category!`);

  // Step 3: Verify
  const { count: remaining } = await supabase
    .from('Books')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'درجہ ثانیہ (2nd Year)');

  console.log(`Remaining books in "درجہ ثانیہ": ${remaining}`);
}

deleteSaniaBooks();
