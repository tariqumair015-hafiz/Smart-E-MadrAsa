import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function upsertSaniaBooks() {
  const data = JSON.parse(readFileSync('tmp/sania_full_data.json', 'utf8'));
  const category = 'درجہ ثانیہ (2nd Year)';
  
  console.log(`Starting upload for ${data.length} books...`);

  for (const book of data) {
    const title = book.title.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
    
    // Determine sub_category
    let sub_category = 'Textbooks';
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('sharh') || lowerTitle.includes('sharah') || lowerTitle.includes('shuroohat') || 
        lowerTitle.includes('tasheel') || lowerTitle.includes('hall') || lowerTitle.includes('takmeel') || 
        lowerTitle.includes('taozih') || lowerTitle.includes('tashrih') || lowerTitle.includes('dars e')) {
      
      if (lowerTitle.includes('arabic') || lowerTitle.includes('arabi')) {
        sub_category = 'Arabic Sharah';
      } else {
        sub_category = 'Urdu Sharah';
      }
    }

    const description = book.links.length > 1 
      ? JSON.stringify(book.links)
      : `Download this book.`;

    const payload = {
      title: title,
      author: 'BestUrduBooks',
      category: category,
      sub_category: sub_category,
      cover_url: book.image,
      pdf_url: book.links[0],
      description: description,
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0
    };

    console.log(`Uploading: ${title} [${sub_category}]`);

    const { error } = await supabase.from('Books').upsert([payload], { onConflict: 'title,category' });
    if (error) console.error(`  Error for ${title}:`, error.message);
  }

  console.log('\nSUCCESS: All Sania books processed!');
}

upsertSaniaBooks().catch(console.error);
