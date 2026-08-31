import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Node 18+ has global fetch, no need to import.

async function fetchAllBooks(batchSize = 1000) {
  let offset = 0;
  let all = [];
  while (true) {
    const { data, error } = await supabase
      .from('Books')
      .select('id,title,cover_url')
      .neq('cover_url', '')
      .range(offset, offset + batchSize - 1);
    if (error) {
      console.error('Supabase error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    offset += batchSize;
    if (data.length < batchSize) break;
  }
  return all;
}

async function checkCovers() {
  const books = await fetchAllBooks();
  console.log('Total books fetched:', books.length);
  let badCount = 0;
  const badSamples = [];
  for (const b of books) {
    try {
      const res = await fetch(b.cover_url, { method: 'HEAD' });
      if (!res.ok) {
        badCount++;
        if (badSamples.length < 20) badSamples.push({ id: b.id, title: b.title, url: b.cover_url, status: res.status });
      }
    } catch (e) {
      badCount++;
      if (badSamples.length < 20) badSamples.push({ id: b.id, title: b.title, url: b.cover_url, err: e.message });
    }
  }
  console.log('📚 Books with problematic cover URLs:', badCount);
  if (badSamples.length) {
    console.log('Sample problematic entries (up to 20):');
    badSamples.forEach(s => console.log(s));
  }
}

checkCovers();
