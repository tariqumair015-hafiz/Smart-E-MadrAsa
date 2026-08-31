import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const categoriesToDelete = [
    'ثانویہ خاصہ سال اول',
    'ثانویہ خاصہ سال دوم',
    'عالیہ بنات سال اول',
    'عالیہ بنات سال دوم',
    'عالمیہ بنات سال اول',
    'عالمیہ بنات سال دوم'
  ];

  let totalDeleted = 0;

  for (const cat of categoriesToDelete) {
    const { data: toDelete, error: selectErr } = await supabase
      .from('Books')
      .select('id, title')
      .eq('category', cat);
      
    if (selectErr) {
        console.error(`Error selecting ${cat}:`, selectErr);
        continue;
    }
    
    if (toDelete.length === 0) {
        console.log(`No books found for category: ${cat}`);
        continue;
    }
    
    console.log(`Found ${toDelete.length} books in category: ${cat}. Deleting...`);
    
    const ids = toDelete.map(b => b.id);
    
    const { data, error } = await supabase
      .from('Books')
      .delete()
      .in('id', ids);
      
    if (error) {
      console.error(`Error deleting ${cat}:`, error);
    } else {
      console.log(`Successfully deleted ${toDelete.length} books for ${cat}`);
      totalDeleted += toDelete.length;
    }
  }
  
  console.log(`\nOperation complete. Total books deleted: ${totalDeleted}`);
}

run();
