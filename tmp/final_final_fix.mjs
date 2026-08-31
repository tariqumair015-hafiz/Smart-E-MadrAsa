import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: girlsBooks } = await supabase
    .from('Books')
    .select('id, title, cover_url')
    .eq('category', 'عالمیہ بنات سال دوم');

  for (const girlBook of girlsBooks) {
    // If cover is a banner or placeholder, try to find a better one
    if (girlBook.cover_url.includes('ASASAD') || girlBook.cover_url.includes('placeholder')) {
      console.log(`Searching real cover for: ${girlBook.title}`);
      
      // Try to find a book with a VERY SIMILAR title that is NOT in this category
      const { data: matches } = await supabase
         .from('Books')
         .select('cover_url, title')
         .neq('category', 'عالمیہ بنات سال دوم')
         .ilike('title', `%${girlBook.title.substring(0, 10)}%`)
         .not('cover_url', 'ilike', '%ASASAD%')
         .not('cover_url', 'ilike', '%placeholder%')
         .limit(10);
      
      if (matches && matches.length > 0) {
         // Find a match that actually has a real cover
         let goodCover = matches.find(m => m.cover_url.includes('wp-content/uploads/'));
         if (goodCover) {
            console.log(`  Applying match from: ${goodCover.title} -> ${goodCover.cover_url}`);
            await supabase.from('Books').update({ cover_url: goodCover.cover_url }).eq('id', girlBook.id);
         }
      }
    }
  }
}

run();
