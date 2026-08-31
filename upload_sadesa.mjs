import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const data = JSON.parse(fs.readFileSync('c:/Users/ut304/.gemini/antigravity/scratch/hafiz-madarsa-pro-v2/sadesa_books.json', 'utf8'));

async function upload() {
  console.log(`Upserting ${data.length} books for درجہ سادسہ...`);

  for (const item of data) {
    const book = {
      title: item.title,
      author: item.author || 'BestUrduBooks',
      category: item.category,
      sub_category: item.sub_category,
      cover_url: item.cover_url,
      pdf_url: item.pdf_url,
      description: JSON.stringify(item.volumes),
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0
    };

    try {
        // Check if exists
        const { data: existing } = await supabase
          .from('Books')
          .select('id')
          .eq('title', book.title)
          .eq('category', book.category)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from('Books')
            .update({ 
                cover_url: book.cover_url, 
                pdf_url: book.pdf_url, 
                description: book.description,
                sub_category: book.sub_category 
            })
            .eq('id', existing.id);
          
          if (error) console.error(`Error updating ${book.title}:`, error.message);
          else console.log(`Updated: ${book.title}`);
        } else {
          const { error } = await supabase.from('Books').insert([book]);
          if (error) console.error(`Error inserting ${book.title}:`, error.message);
          else console.log(`Inserted: ${book.title}`);
        }
    } catch (e) {
        console.error(`Unexpected error for ${book.title}:`, e.message);
    }
  }
  console.log("Upload/Update Complete!");
}

upload();
