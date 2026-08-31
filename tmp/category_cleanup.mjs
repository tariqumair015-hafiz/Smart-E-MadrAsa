import fs from 'fs';
import { supabase } from '../src/supabaseClient.js';

async function fixEncodingMismatch() {
  const content = fs.readFileSync('src/App.jsx', 'utf8');
  const match = content.match(/'([^']+)', en: 'Encyclopedias'/);
  if (!match) {
    console.error('Could not find Encyclopedias label in App.jsx');
    process.exit(1);
  }
  
  const labelFromApp = match[1];
  console.log(`Label in App.jsx: "${labelFromApp}"`);
  
  // Update all books with "انسائیکلوپیڈیا" or "معارف" in category to this exact label
  const { data, error } = await supabase.from('Books').select('id, category').or(`category.ilike.%معارف%,category.ilike.%Encyclopedia%`);
  if (error) {
    console.error('Error fetching:', error);
    process.exit(1);
  }
  
  console.log(`Found ${data.length} candidate books.`);
  
  for (const book of data) {
     const { error: updateError } = await supabase.from('Books').update({ category: labelFromApp }).eq('id', book.id);
     if (updateError) console.error(`Failed to update ${book.id}:`, updateError);
  }
  
  // Also check if any other category name mismatch happened
  // Let's do a general cleanup of all EXTRA_CATEGORIES
  const extraMatch = content.match(/const EXTRA_CATEGORIES = \[([\s\S]+?)\];/);
  if (extraMatch) {
     const labels = Array.from(extraMatch[1].matchAll(/{ label: '([^']+)', en: '([^']+)' }/g))
       .map(m => ({ label: m[1], en: m[2] }));
       
     for (const cat of labels) {
       console.log(`Checking/Fixing: ${cat.label} (${cat.en})`);
       // Find books that match either the label or the english name and force them to the exact label
       const { data: bks } = await supabase.from('Books').select('id, category').or(`category.eq.${cat.label},category.eq.${cat.en}`);
       if (bks && bks.length > 0) {
         for (const b of bks) {
           if (b.category !== cat.label) {
             await supabase.from('Books').update({ category: cat.label }).eq('id', b.id);
           }
         }
       }
     }
  }
  
  console.log('Cleanup finished.');
  process.exit(0);
}

fixEncodingMismatch();
