import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function upsertSaniaBooks() {
  const data = JSON.parse(readFileSync('tmp/sania_full_data.json', 'utf8'));
  const category = 'درجہ ثانیہ';
  
  console.log(`Starting clean upsert for ${data.length} books into category: ${category}...`);

  for (const book of data) {
    const title = book.title.replace(/&amp;/g, '&').replace(/&#8211;/g, '-').trim();
    const pdf_url = book.links[0];
    
    // Determine sub_category using Urdu names to match App.jsx
    let sub_category = 'درسی کتب';
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('sharh') || lowerTitle.includes('sharah') || lowerTitle.includes('shuroohat') || 
        lowerTitle.includes('tasheel') || lowerTitle.includes('hall') || lowerTitle.includes('takmeel') || 
        lowerTitle.includes('taozih') || lowerTitle.includes('tashrih') || lowerTitle.includes('dars e') || 
        lowerTitle.includes('explanation')) {
      
      if (lowerTitle.includes('arabic') || lowerTitle.includes('arabi')) {
        sub_category = 'عربی شروحات';
      } else {
        sub_category = 'اردو شروحات';
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
      pdf_url: pdf_url,
      description: description,
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0
    };

    // 1. Check by title + category
    const { data: existingByTitle } = await supabase
      .from('Books')
      .select('id')
      .eq('title', title)
      .eq('category', category)
      .maybeSingle();

    if (existingByTitle) {
      const { error } = await supabase
        .from('Books')
        .update({
          cover_url: book.image,
          pdf_url: pdf_url,
          description: description,
          sub_category: sub_category
        })
        .eq('id', existingByTitle.id);
      
      if (error) console.error(`  [Update Error (Title)] ${title}:`, error.message);
      else console.log(`[UPDATED (Title Match)] ${title}`);
      continue;
    }

    // 2. Check by pdf_url
    const { data: existingByPdf } = await supabase
      .from('Books')
      .select('id, title')
      .eq('pdf_url', pdf_url)
      .maybeSingle();

    if (existingByPdf) {
      console.log(`[SKIP] Duplicate PDF link for "${title}" (Already exists as "${existingByPdf.title}")`);
      continue;
    }

    // 3. Insert new book
    const { error } = await supabase.from('Books').insert([bookPayload]);
    if (error) console.error(`  [Insert Error] ${title}:`, error.message);
    else console.log(`[INSERTED] ${title}`);
  }

  console.log('\nSUCCESS: 2nd Year Catalog is synced with Urdu sub-categories!');
}

upsertSaniaBooks().catch(console.error);
