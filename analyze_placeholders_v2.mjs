import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyze() {
  const allCovers = [];
  let offset = 0;
  const batchSize = 1000;
  
  console.log('Fetching database...');
  while (true) {
    const { data, error } = await supabase
      .from('Books')
      .select('cover_url')
      .range(offset, offset + batchSize - 1);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    allCovers.push(...data.map(b => b.cover_url));
    offset += batchSize;
    if (data.length < batchSize) break;
  }
  
  const freq = {};
  allCovers.forEach(u => {
    if (!u) return;
    freq[u] = (freq[u] || 0) + 1;
  });
  
  const sorted = Object.entries(freq).filter(e => e[1] > 1).sort((a,b) => b[1] - a[1]);
  
  const report = sorted.map(([url, count]) => `${count} times: ${url}`).join('\n');
  fs.writeFileSync('cover_report.txt', '--- Repeated Cover URLs report ---\n' + report);
  console.log('Report saved to cover_report.txt');
}

analyze();
