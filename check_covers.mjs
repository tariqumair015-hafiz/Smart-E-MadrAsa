import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ymizqgtlnhvkqlidftiy.supabase.co',
  'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'
);

async function checkCovers() {
  console.log('🔍 Checking cover images in database...\n');
  
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

  const total = allBooks.length;
  const withCover = allBooks.filter(b => b.cover_url && b.cover_url.trim() !== '').length;
  const withoutCover = allBooks.filter(b => !b.cover_url || b.cover_url.trim() === '').length;

  console.log(`📚 Total Books: ${total}`);
  console.log(`✅ Books WITH cover_url: ${withCover} (${((withCover/total)*100).toFixed(1)}%)`);
  console.log(`❌ Books WITHOUT cover_url: ${withoutCover} (${((withoutCover/total)*100).toFixed(1)}%)\n`);

  // Group missing covers by category
  const missingByCategory = {};
  allBooks.filter(b => !b.cover_url || b.cover_url.trim() === '').forEach(b => {
    const cat = b.category || 'Unknown';
    if (!missingByCategory[cat]) missingByCategory[cat] = [];
    missingByCategory[cat].push(b.title);
  });

  console.log('📊 Missing covers by Category:');
  Object.entries(missingByCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([cat, titles]) => {
      console.log(`  [${titles.length}] ${cat}`);
      titles.slice(0, 3).forEach(t => console.log(`      - ${t}`));
      if (titles.length > 3) console.log(`      ... and ${titles.length - 3} more`);
    });
}

checkCovers().catch(console.error);
