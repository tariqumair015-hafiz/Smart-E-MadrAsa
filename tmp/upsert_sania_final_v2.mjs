import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function upsertSaniaBooks() {
  const data = JSON.parse(readFileSync('tmp/sania_full_data.json', 'utf8'));
  const category = 'درجہ ثانیہ (2nd Year)';
  
  console.log(`Starting clean upsert for ${data.length} books...`);

  for (const book of data) {
    const title = book.title.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
    
    // Determine sub_category
    let sub_category = 'Textbooks';
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('sharh') || lowerTitle.includes('sharah') || lowerTitle.includes('shuroohat') || 
        lowerTitle.includes('tasheel') || lowerTitle.includes('hall') || lowerTitle.includes('takmeel') || 
        lowerTitle.includes('taozih') || lowerTitle.includes('tashrih') || lowerTitle.includes('dars e') ||
        lowerTitle.includes('darsi taqreer') || lowerTitle.includes('explanation')) {
      
      if (lowerTitle.includes('arabic') || lowerTitle.includes('arabi')) {
        sub_category = 'Arabic Sharah';
      } else {
        sub_category = 'Urdu Sharah';
      }
    }

    const description = book.links.length > 1 
      ? JSON.stringify(book.links)
      : `Download this book.`;

    const bookPayload = {
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

    // Manual check for existence to avoid ON CONFLICT constraint error if it's missing on table
    const { data: existing } = await supabase
      .from('Books')
      .select('id')
      .eq('title', title)
      .eq('category', category)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('Books')
        .update({
          cover_url: book.image,
          pdf_url: book.links[0],
          description: description,
          sub_category: sub_category
        })
        .eq('id', existing.id);
      
      if (error) console.error(`  [Update Error] ${title}:`, error.message);
      else console.log(`[UPDATED] ${title}`);
    } else {
      const { error } = await supabase.from('Books').insert([bookPayload]);
      if (error) console.error(`  [Insert Error] ${title}:`, error.message);
      else console.log(`[INSERTED] ${title}`);
    }
  }

  console.log('\nSUCCESS: 2nd Year Catalog is synced!');
}

upsertSaniaBooks().catch(console.error);
