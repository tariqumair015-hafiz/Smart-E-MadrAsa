import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to count volumes in the description JSON
function volumeCount(desc) {
  try {
    const arr = JSON.parse(desc || '[]');
    return Array.isArray(arr) ? arr.length : 0;
  } catch (e) {
    return 0;
  }
}

async function cleanDuplicates() {
  console.log('Fetching all books...');
  const { data: books, error } = await supabase
    .from('Books')
    .select('id, title, description')
    .order('title', { ascending: true });

  if (error) {
    console.error('Fetch error:', error.message);
    return;
  }

  // Group by title
  const groups = {};
  books.forEach(b => {
    const key = b.title.trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  const toDelete = [];
  for (const [title, items] of Object.entries(groups)) {
    if (items.length < 2) continue; // no duplicate
    // Determine if any entry has more than one volume
    const hasMulti = items.some(i => volumeCount(i.description) > 1);
    if (!hasMulti) continue; // keep all if no multi‑volume entry
    // Find the entry with the highest volume count (the multi‑volume one)
    let best = items[0];
    let bestCount = volumeCount(best.description);
    items.forEach(item => {
      const cnt = volumeCount(item.description);
      if (cnt > bestCount) {
        best = item;
        bestCount = cnt;
      }
    });
    // Delete all other entries that have only a single volume
    items.forEach(item => {
      if (item.id !== best.id && volumeCount(item.description) <= 1) {
        toDelete.push(item.id);
      }
    });
  }

  console.log(`Found ${toDelete.length} single‑volume duplicates to delete.`);
  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Delete in batches of 50
  const batchSize = 50;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const { error: delErr, count } = await supabase
      .from('Books')
      .delete()
      .in('id', batch)
      .select('id', { count: 'exact' });
    if (delErr) {
      console.error('Delete error for batch', i / batchSize + 1, delErr.message);
    } else {
      console.log(`Deleted batch ${i / batchSize + 1}: ${count} rows`);
    }
  }

  console.log('Cleanup complete.');
}

cleanDuplicates().catch(e => console.error('Unexpected error:', e));
