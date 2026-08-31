import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const data = JSON.parse(fs.readFileSync('c:/Users/ut304/.gemini/antigravity/scratch/hafiz-madarsa-pro-v2/salesa_books.json', 'utf8'));

async function upload() {
  console.log(`Uploading ${data.length} books for درجہ ثالثہ...`);

  for (const item of data) {
    const book = {
      title: item.title,
      author: item.author || 'BestUrduBooks',
      category: item.category,
      sub_category: item.sub_category,
      cover_url: item.cover_url,
      pdf_url: item.pdf_url,
      description: JSON.stringify(item.volumes), // Store all volumes in description
      size_mb: 15, // Default or parse from Link title if needed
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0
    };

    // Check if exists
    const { data: existing } = await supabase
      .from('Books')
      .select('id')
      .eq('title', book.title)
      .eq('category', book.category)
      .maybeSingle();

    if (existing) {
      console.log(`Skipping existing: ${book.title}`);
    } else {
      const { error } = await supabase.from('Books').insert([book]);
      if (error) {
        console.error(`Error inserting ${book.title}:`, error.message);
      } else {
        console.log(`Successfully uploaded: ${book.title}`);
      }
    }
  }
  console.log("Upload Complete!");
}

upload();
