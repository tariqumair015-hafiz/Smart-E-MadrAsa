import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Starting tasks...");

  // TASK 1: Move "Kanz ud Daqaiq" books from 3rd year to 4th year
  console.log("\n--- TASK 1: MOVING KANZ UID DAQAIQ BOOKS ---");
  const { data: kanzBooks, error: kanzErr } = await supabase
    .from('Books')
    .select('*')
    .eq('category', 'درجہ ثالثہ')
    .ilike('title', '%kanz%'); // Using ilike which is case-insensitive PostgreSQL match
    
  const { data: kanzBooksUrdu, error: kanzUrduErr } = await supabase
    .from('Books')
    .select('*')
    .eq('category', 'درجہ ثالثہ')
    .ilike('title', '%کنز%');

  const allKanz = [...(kanzBooks||[]), ...(kanzBooksUrdu||[])];
  
  // Also catch 'Haqaiq' just in case some don't say Kanz explicitly but were in the screenshot
  const { data: haqaiqBooks, error: hqErr } = await supabase
    .from('Books')
    .select('*')
    .eq('category', 'درجہ ثالثہ')
    .ilike('title', '%haqaiq%');

  const combinedKanz = [...allKanz, ...(haqaiqBooks||[])];
  // Deduplicate
  const uniqueKanz = Array.from(new Map(combinedKanz.map(item => [item.id, item])).values());

  if (uniqueKanz.length > 0) {
    console.log(`Found ${uniqueKanz.length} Kanz/Haqaiq books in 3rd Year to move...`);
    for (const b of uniqueKanz) {
      console.log(`  - Moving: ${b.title}`);
      const { error: updErr } = await supabase
        .from('Books')
        .update({ category: 'درجہ رابعہ' })
        .eq('id', b.id);
      if (updErr) console.error(`Failed to move ${b.id}:`, updErr.message);
    }
    console.log("Task 1 complete!");
  } else {
    console.log("No Kanz books found in 3rd year.");
  }


  // TASK 2: Copy "Quduri" books from 2nd year to 3rd year
  console.log("\n--- TASK 2: COPYING QUDURI BOOKS ---");
  const { data: quduriBooks1, error: qErr1 } = await supabase
    .from('Books')
    .select('*')
    .eq('category', 'درجہ ثانیہ (2nd Year)')
    .ilike('title', '%quduri%');
    
  const { data: quduriBooks2, error: qErr2 } = await supabase
    .from('Books')
    .select('*')
    .eq('category', 'درجہ ثانیہ (2nd Year)')
    .ilike('title', '%قدوری%');

  const combinedQuduri = [...(quduriBooks1||[]), ...(quduriBooks2||[])];
  const uniqueQuduri = Array.from(new Map(combinedQuduri.map(item => [item.id, item])).values());

  if (uniqueQuduri.length > 0) {
    console.log(`Found ${uniqueQuduri.length} Quduri books in 2nd Year to copy...`);
    
    // Check if they already exist in 3rd year to avoid double copy
    const { data: existingSalesa } = await supabase
      .from('Books')
      .select('title')
      .eq('category', 'درجہ ثالثہ');
    const existingTitles = new Set((existingSalesa||[]).map(x => x.title));

    for (const b of uniqueQuduri) {
      if (existingTitles.has(b.title)) {
        console.log(`  - Skip: Already exists in 3rd year -> ${b.title.substring(0,30)}`);
        continue;
      }
      
      console.log(`  - Copying: ${b.title}`);
      
      // Clean up the URL to append a fresh unique hash, 
      // preventing the global pdf_url Unique Constraint violation
      let safeUrl = b.pdf_url;
      if (safeUrl) {
         if (safeUrl.includes('#hash=')) {
            safeUrl = safeUrl.split('#hash=')[0];
         }
         safeUrl += '#hash=' + Math.random().toString(36).substring(7);
      }

      const newBook = {
        title: b.title,
        author: b.author,
        category: 'درجہ ثالثہ',         // The new target category
        sub_category: b.sub_category,  // Keep 'Textbooks' or 'Commentaries'
        cover_url: b.cover_url,
        pdf_url: safeUrl,
        description: b.description,
        size_mb: b.size_mb,
        is_free: b.is_free,
        downloads: b.downloads,
        rating: b.rating,
        pages: b.pages
      };

      const { error: insErr } = await supabase.from('Books').insert([newBook]);
      if (insErr) {
         console.error(`Failed to copy ${b.title}:`, insErr.message);
      }
    }
    console.log("Task 2 complete!");
  } else {
    console.log("No Quduri books found in 2nd year to copy!");
  }
}

run();
