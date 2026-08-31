import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: girlsBooks } = await supabase
    .from('Books')
    .select('id, title, cover_url')
    .eq('category', 'عالمیہ بنات سال دوم');

  for (const book of girlsBooks) {
    if (book.cover_url.includes('placeholder')) {
      console.log(`Searching cover for: ${book.title}`);
      
      // Split the title into parts and search for common terms
      const commonTerms = ['بخاری', 'مسلم', 'ترمذی', 'ابو داؤد', 'شمائل'];
      let matchedTerm = commonTerms.find(term => book.title.includes(term));
      
      if (matchedTerm) {
         // Find any book in the database that has a valid cover for this term
         const { data: source } = await supabase
           .from('Books')
           .select('cover_url')
           .ilike('title', `%${matchedTerm}%`)
           .not('cover_url', 'ilike', '%placeholder%')
           .limit(1);

         if (source && source.length > 0) {
           console.log(`  Applying general cover for ${matchedTerm}: ${source[0].cover_url}`);
           await supabase.from('Books').update({ cover_url: source[0].cover_url }).eq('id', book.id);
         }
      }
    }
  }
}

run();
