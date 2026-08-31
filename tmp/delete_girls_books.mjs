import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching distinct categories/years to identify Girls section...");
  
  // We want to delete books that belong to the Girls section.
  const categoriesToDelete = [
    'ثانویہ خاصہ بنات سال اول',
    'ثانویہ خاصہ بنات سال دوم',
    'عالیہ بنات سال اول',
    'عالیہ بنات سال دوم',
    'عالمیہ بنات سال اول',
    'عالمیہ بنات سال دوم',
    'Khasa Year 1',
    'Khasa Year 2',
    'Aliyah Year 1',
    'Aliyah Year 2',
    'Alamiyyah Year 1',
    'Alamiyyah Year 2',
    'Khasa Banat First Year',
    'Khasa Banat Second Year',
    'Aliyah Banat First Year',
    'Aliyah Banat Second Year',
    'Alamiyah Banat First Year',
    'Alamiyah Banat Second Year'
  ];

  // Let's first scan what we have
  const { data: allBooks, error: fetchError } = await supabase
    .from('Books')
    .select('id, category, year, title');

  if (fetchError) {
    console.error("Error fetching books:", fetchError);
    return;
  }

  const toDelete = allBooks.filter(b => {
    return categoriesToDelete.includes(b.category) || 
           (b.category && b.category.includes('بنات')) ||
           (b.category && b.category.toLowerCase().includes('banat')) ||
           (b.year >= 9 && b.year <= 14); // Assuming 9-14 are the girl's years as per standard dars-e-nizami schema if mapped so.
  });
  
  console.log(`Found ${toDelete.length} books to delete.`);
  
  if (toDelete.length > 0) {
      // Print first 5 for sanity check
      for(let i=0; i<Math.min(5, toDelete.length); i++) {
          console.log(` - ${toDelete[i].title} (Cat: ${toDelete[i].category}, Year: ${toDelete[i].year})`);
      }
      
      const ids = toDelete.map(b => b.id);
      
      // Since delete might be limited, let's delete in batches if it's large, but usually a single IN query works up to 1000 items. // Or just .in('id', ids)
      // Actually Supabase JS supports deleting by match
      
      const { data, error } = await supabase
        .from('Books')
        .delete()
        .in('id', ids);
        
      if (error) {
        console.error("Error deleting books:", error);
      } else {
        console.log(`Successfully deleted ${ids.length} books.`);
      }
  }
}

run();
