import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const filePath = 'c:/Users/ut304/.gemini/antigravity/scratch/hafiz-madarsa-pro-v2/daura_urdu_shuroohat.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

async function upload() {
  console.log(`Upserting ${data.length} distinct publisher books for دورہ حدیث (Urdu Shuroohat)...`);

  for (const item of data) {
    if (!item.title || !item.pdf_url) continue;

    const book = {
      title: item.title,
      author: 'BestUrduBooks',
      category: item.category,
      sub_category: item.sub_category,
      cover_url: item.cover_url,
      pdf_url: item.pdf_url,
      description: JSON.stringify(item.volumes || []),
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0
    };

    try {
        let { data: existing } = await supabase
          .from('Books')
          .select('id')
          .eq('title', book.title)
          .eq('category', book.category)
          .maybeSingle();

        if (!existing) {
          const { data: existingByUrl } = await supabase
            .from('Books')
            .select('id')
            .eq('pdf_url', book.pdf_url)
            .maybeSingle();
          existing = existingByUrl;
        }

        if (existing) {
          const { error } = await supabase
            .from('Books')
            .update({ 
                title: book.title,
                category: book.category,
                cover_url: book.cover_url, 
                description: book.description,
                sub_category: book.sub_category 
            })
            .eq('id', existing.id);
          
          if (error) console.error(`Error updating ${book.title}:`, error.message);
          else console.log(`Updated: ${book.title}`);
        } else {
          const { error } = await supabase.from('Books').insert([book]);
          if (error) {
            if (error.code === '23505') console.log(`Skipping duplicate URL for: ${book.title}`);
            else console.error(`Error inserting ${book.title}:`, error.message);
          }
          else console.log(`Inserted: ${book.title}`);
        }
    } catch (e) {
        console.error(`Unexpected error for ${book.title}:`, e.message);
    }
  }
  console.log("Upload/Update Complete!");
}

upload();
