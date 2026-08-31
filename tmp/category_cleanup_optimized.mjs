import fs from 'fs';
import { supabase } from '../src/supabaseClient.js';

async function fixEncodingMismatchOptimized() {
  const content = fs.readFileSync('src/App.jsx', 'utf8');
  
  // Extract all labels from EXTRA_CATEGORIES
  const extraMatch = content.match(/const EXTRA_CATEGORIES = \[([\s\S]+?)\];/);
  if (!extraMatch) {
    console.error('Could not find EXTRA_CATEGORIES in App.jsx');
    process.exit(1);
  }
  
  const categories = Array.from(extraMatch[1].matchAll(/{ label: '(.*?)', en: '(.*?)' }/g))
    .map(m => ({ label: m[1], en: m[2] }));
    
  console.log(`Extracted ${categories.length} categories from App.jsx`);
  
  for (const cat of categories) {
    // Force books with current label OR english name to the exact label
    const { data, count, error } = await supabase.from('Books')
      .update({ category: cat.label })
      .or(`category.eq."${cat.label}",category.eq."${cat.en}"`)
      .select('id', { count: 'exact' });
      
    if (error) {
      console.error(`Error for ${cat.label}:`, error);
    } else {
      console.log(`Success: ${cat.label} -> ${data?.length || 0} books synced.`);
    }
    
    // Also check for common "Urdu synonyms" if possible, e.g. for Encyclopedia
    if (cat.en === 'Encyclopedias') {
      const { data: encBks } = await supabase.from('Books').update({ category: cat.label }).ilike('title', '%انسائیکلوپیڈیا%').select('id');
      console.log(`Forced ${encBks?.length || 0} Encyclopedia titles into the category.`);
    }
  }
  
  console.log('Cleanup finished.');
  process.exit(0);
}

fixEncodingMismatchOptimized();
