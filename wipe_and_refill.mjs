import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function wipe() {
    console.log("Cleaning up existing books for 2nd and 6th year...");
    const { count: s2 } = await supabase.from('Books').delete().eq('category', 'درجہ ثانیہ');
    const { count: s6 } = await supabase.from('Books').delete().eq('category', 'درجہ سادسہ');
    console.log(`Wiped existing records (if any).`);
}

async function upload() {
    const data = JSON.parse(fs.readFileSync('perfect_scrape.json', 'utf8'));
    console.log(`Uploading ${data.length} perfect books...`);

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

        const { error } = await supabase.from('Books').insert([book]);
        if (error) {
            if (error.code === '23505') {
                 console.log(`  Skipping duplicate: ${book.title}`);
            } else {
                 console.error(`  Error inserting ${book.title}:`, error.message);
            }
        } else {
            console.log(`  Uploaded: ${book.title}`);
        }
    }
    console.log("Upload Complete!");
}

async function run() {
    await wipe();
    await upload();
}

run();
