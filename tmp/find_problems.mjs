import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync } from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getProblematicBooks() {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, cover_url, sub_category, pdf_url')
    .eq('category', 'درجہ اولیٰ');

  if (error) { console.error(error); return; }

  // Find books with corrupted titles (contain ExpandExpand garbage)
  const corrupted = data.filter(b => b.title.includes('Expand') || b.title === 'Untitled');
  
  // Find books with missing covers
  const noCover = data.filter(b => !b.cover_url || b.cover_url.trim() === '');
  
  // Find books with broken cover URLs (we'll check later)
  
  // Output the IDs and details for fixing
  const result = {
    corrupted_titles: corrupted.map(b => ({ id: b.id, title: b.title.substring(0, 80), pdf_url: b.pdf_url })),
    no_cover_ids: noCover.map(b => ({ id: b.id, title: b.title.substring(0, 80) })),
    // Books that need sub_category fix (sharah books wrongly marked as darsi)
    sharah_misclassified: data.filter(b => 
      (b.title.toLowerCase().includes('sharh') || b.title.toLowerCase().includes('sharah') || b.title.includes('شرح')) && 
      b.sub_category === 'درسی کتب' &&
      !b.title.toLowerCase().includes('miata amil') && // Sharh Miata Amil is a textbook
      !b.title.toLowerCase().includes('awamil')
    ).map(b => ({ id: b.id, title: b.title.substring(0, 80), sub: b.sub_category })),
  };

  writeFileSync('tmp/fix_needed.json', JSON.stringify(result, null, 2), 'utf8');
  console.log('Corrupted titles:', result.corrupted_titles.length);
  console.log('No cover:', result.no_cover_ids.length);
  console.log('Sharah misclassified:', result.sharah_misclassified.length);
}

getProblematicBooks().catch(console.error);
