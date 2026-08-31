import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = JSON.parse(fs.readFileSync('c:/Users/ut304/.gemini/antigravity/scratch/hafiz-madarsa-pro-v2/al_aula_books.json', 'utf8'));

async function upload() {
  console.log(`Starting upload process for ${rawData.length} books...`);
  
  for (const item of rawData) {
    let sizeMb = 0;
    if (item.size) {
      sizeMb = parseInt(item.size.replace(/[^0-9]/g, '')) || 0;
    }

    const book = {
      title: item.title,
      author: item.author || 'BestUrduBooks',
      category: item.category || 'درجہ اولیٰ',
      sub_category: item.sub_category || 'درسی کتب',
      cover_url: item.cover_url,
      pdf_url: item.pdf_url,
      size_mb: sizeMb,
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
  console.log("Done!");
}

upload();
