import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCovers() {
  try {
    console.log('Fetching all books...');
    let allBooks = [];
    let offset = 0;
    const batchSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('Books')
        .select('id,title,cover_url')
        .neq('cover_url', null)
        .neq('cover_url', '')
        .range(offset, offset + batchSize - 1);
      
      if (error) { throw error; }
      if (!data || data.length === 0) break;
      allBooks.push(...data);
      offset += batchSize;
      if (data.length < batchSize) break;
    }
    
    console.log(`Checking ${allBooks.length} covers...`);
    let badCount = 0;
    const concur = 50; 
    
    for (let i = 0; i < allBooks.length; i += concur) {
      const slice = allBooks.slice(i, i + concur);
      const results = await Promise.all(slice.map(async (b) => {
        try {
          // Use its own fetch with timeout
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(b.cover_url, { method: 'HEAD', signal: controller.signal });
          clearTimeout(tid);
          return res.ok;
        } catch (e) {
          // console.log(`Book ${b.id} fail:`, e.name);
          return false;
        }
      }));
      
      results.forEach(ok => { if (!ok) badCount++; });
      if (i % 500 === 0) console.log(`Progress: ${i}/${allBooks.length}...`);
    }
    
    console.log('\n--- FINAL REPORT ---');
    console.log('Total books checked:', allBooks.length);
    console.log('Total broken covers:', badCount);
  } catch (err) {
    console.error('FATAL ERROR:', err);
  }
}

checkCovers().catch(e => console.error('Toplevel catch:', e));
