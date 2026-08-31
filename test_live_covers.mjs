import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ymizqgtlnhvkqlidftiy.supabase.co',
  'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'
);

async function checkLiveCovers() {
  console.log('🔍 Fetching all books from database...\n');
  
  let allBooks = [];
  let from = 0;
  const step = 999;
  
  while (true) {
    const { data, error } = await supabase
      .from('Books')
      .select('id, title, category, cover_url')
      .order('id', { ascending: true })
      .range(from, from + step);
    
    if (error) { console.error('Error:', error); break; }
    if (!data || data.length === 0) break;
    allBooks.push(...data);
    from += step + 1;
  }

  const booksWithCover = allBooks.filter(b => b.cover_url && b.cover_url.trim() !== '');
  console.log(`Testing first 50 cover URLs out of ${booksWithCover.length}...\n`);

  let failedCovers = [];

  for (let i = 0; i < 50; i++) {
    const book = booksWithCover[i];
    try {
      // Simulate browser request
      const response = await fetch(book.cover_url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
      });

      if (!response.ok) {
        console.log(`❌ FAILED: ${book.title} (Status: ${response.status}) -> ${book.cover_url}`);
        failedCovers.push({ title: book.title, url: book.cover_url, status: response.status });
      } else {
        console.log(`✅ OK: ${book.title}`);
      }
    } catch (err) {
      console.log(`❌ ERROR: ${book.title} -> ${err.message}`);
      failedCovers.push({ title: book.title, url: book.cover_url, status: err.message });
    }
    
    // Add small delay to avoid being blocked
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nResults: ${failedCovers.length} failed out of 50.`);
}

checkLiveCovers().catch(console.error);
