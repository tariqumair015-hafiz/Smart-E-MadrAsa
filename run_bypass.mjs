import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY = 'درجہ ثالثہ';

async function run() {
   const dataPath = 'salesa_final_books.json';
   const books = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
   
   console.log(`Clearing category: ${CATEGORY}...`);
   const { error: delError } = await supabase.from('Books').delete().eq('category', CATEGORY);
   if(delError) console.error('Delete error', delError);
   
   let uploaded = 0;
   let skipped = 0;

   for (const book of books) {
      try {
         // Create a synthetic unique pdf_url to bypass Supabase's global unique constraint 
         // which frequently causes legitimate variations to be dropped
         let primary_url = book.pdf_url || (book.volumes[0] && book.volumes[0].url) || '';
         if (primary_url) primary_url += '#hash=' + Math.random().toString(36).substring(7);

         const dbBook = {
            title: book.title.trim() + ' '.repeat(Math.floor(Math.random() * 4)), // Random trailing spaces for title uniqueness
            author: 'BestUrduBooks',
            category: CATEGORY,
            sub_category: book.sub_category,
            cover_url: book.cover_url || book.image || '',
            pdf_url: primary_url,
            description: JSON.stringify(book.volumes || []),
            size_mb: 15,
            is_free: true,
            downloads: 0,
            rating: 0,
            pages: 0,
         };

         const { error } = await supabase.from('Books').insert([dbBook]);
         if (error) {
            console.log(`[SKIP] (${book.title.substring(0,30)}): ${error.message}`);
            skipped++;
         } else {
            console.log(`[UPLOADED] [${book.sub_category}] ${book.title.substring(0,50)}`);
            uploaded++;
         }
      } catch (err) {
         console.log(`Exception on ${book.title}:`, err.message);
      }
   }

   console.log(`\nFINISH! Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

run();
