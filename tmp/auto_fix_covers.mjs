import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Identifying books with missing covers in Alamiyyah Year 2...");
  const { data: missingBooks, error } = await supabase
    .from('Books')
    .select('id, title, cover_url')
    .eq('category', 'عالمیہ بنات سال دوم')
    .ilike('cover_url', '%placeholder%');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${missingBooks.length} books with missing covers.`);

  for (const book of missingBooks) {
    console.log(`\\nSearching for: ${book.title}`);
    
    // Extract base title (remove "اردو شرح", "جلد", authors, etc. for better matching)
    let searchTitle = book.title
      .replace(/اردو شرح|شرح اردو|شرح|جلد|حصہ/g, '')
      .split('از')[0]
      .split('مولانا')[0]
      .split('مفتی')[0]
      .trim();
    
    if (searchTitle.length < 5) searchTitle = book.title.substring(0, 20);

    // Search for any book with a similar title that HAS a cover and IS NOT a placeholder
    const { data: matches } = await supabase
      .from('Books')
      .select('title, cover_url, category')
      .ilike('title', `%${searchTitle}%`)
      .not('cover_url', 'ilike', '%placeholder%')
      .limit(5);

    if (matches && matches.length > 0) {
      console.log(`  Found ${matches.length} potential matches.`);
      // Take the first one or try to find a "Boys" section one specifically
      let bestMatch = matches[0];
      console.log(`  Applying cover from: ${bestMatch.title} (${bestMatch.category})`);
      
      const { error: updErr } = await supabase
        .from('Books')
        .update({ cover_url: bestMatch.cover_url })
        .eq('id', book.id);
      
      if (updErr) console.error(`  Error updating: ${updErr.message}`);
      else console.log(`  SUCCESS!`);
    } else {
      console.log(`  No matches found for "${searchTitle}"`);
    }
  }
}

run();
