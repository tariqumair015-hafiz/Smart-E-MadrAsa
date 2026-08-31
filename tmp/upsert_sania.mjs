import { createClient } from '@supabase/supabase-client';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || ''; // I will set this or use the one I have
const supabase = createClient(supabaseUrl, supabaseKey);

async function upsertSaniaBooks() {
  const data = JSON.parse(readFileSync('tmp/sania_full_data.json', 'utf8'));
  const category = 'درجہ ثانیہ (2nd Year)';
  
  console.log(`Starting upsert for ${data.length} books...`);

  const processedBooks = data.map(book => {
    const title = book.title.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
    
    // Logic to determine type
    let type = 'Textbooks'; // Default
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('sharh') || 
        lowerTitle.includes('sharah') || 
        lowerTitle.includes('shuroohat') || 
        lowerTitle.includes('tasheel') || 
        lowerTitle.includes('taozeeh') || 
        lowerTitle.includes('hall') || 
        lowerTitle.includes('takmeel') || 
        lowerTitle.includes('irshad') || 
        lowerTitle.includes('moeen') || 
        lowerTitle.includes('misbah') || 
        lowerTitle.includes('dars e') || 
        lowerTitle.includes('darsi taqreer')) {
      
      // Determine if it's Arabic or Urdu Sharah
      if (lowerTitle.includes('arabic') || lowerTitle.includes('arabi')) {
        type = 'Arabic Sharah';
      } else {
        type = 'Urdu Sharah';
      }
    }

    // Special case for textbooks
    if (lowerTitle.includes('nisabi') || lowerTitle.includes('darsi kitat')) {
       type = 'Textbooks';
    }

    // Build description for multi-volume support
    const description = book.links.length > 1 
      ? `Available Volumes/Links:\n${book.links.map((l, i) => `Vol ${i+1}: ${l}`).join('\n')}`
      : `Download this book.`;

    return {
      title: title,
      author: 'Various',
      image_url: book.image,
      download_url: book.links[0], // First link as primary
      description: description,
      category: category,
      type: type
    };
  });

  // Batch insert
  const { error } = await supabase
    .from('Books')
    .upsert(processedBooks, { onConflict: 'title,category' });

  if (error) {
    console.error('Error upserting books:', error);
  } else {
    console.log('Successfully upserted all Sania books!');
  }
}

upsertSaniaBooks().catch(console.error);
