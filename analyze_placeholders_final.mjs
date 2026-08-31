import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findRepeatedCovers() {
  const allCovers = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('Books')
      .select('cover_url')
      .range(offset, offset + batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    allCovers.push(...data.map(b => b.cover_url));
    offset += batchSize;
    if (data.length < batchSize) break;
  }
  
  const counts = {};
  allCovers.forEach(url => {
    if (!url) return;
    counts[url] = (counts[url] || 0) + 1;
  });
  
  const sorted = Object.entries(counts)
    .filter(([u, c]) => c > 1)
    .sort((a, b) => b[1] - a[1]);
    
  console.log('REPEATED COVER URLS REPORT:');
  sorted.forEach(([u, c]) => {
     console.log(`${c} times => ${u}`);
  });
}

findRepeatedCovers();
