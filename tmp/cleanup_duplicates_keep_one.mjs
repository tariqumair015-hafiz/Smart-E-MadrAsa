import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function volumeCount(desc){
  try{ const arr = JSON.parse(desc||'[]'); return Array.isArray(arr)?arr.length:0; }catch(e){return 0;}
}

async function cleanupDuplicates(){
  console.log('Fetching all books...');
  const {data: books, error} = await supabase.from('Books').select('id,title,description,sub_category').order('title');
  if(error){ console.error('Fetch error:', error.message); return; }
  console.log(`Fetched ${books.length} books in total.`);

  // Group by fuzzy title (lowercase, collapsed spaces)
  const groups = {};
  books.forEach(b => {
    // Better key: remove multiple spaces, lowercase, trim
    const key = b.title.trim().toLowerCase().replace(/\s+/g, ' ');
    if(!groups[key]) groups[key] = [];
    groups[key].push({
      id: b.id,
      title: b.title,
      sub: b.sub_category,
      vol: volumeCount(b.description)
    });
  });

  const toDelete = [];
  for(const [title, items] of Object.entries(groups)){
    if(items.length < 2) continue; // no duplicate
    // Determine the best record to keep
    // 1. Highest volume count
    // 2. If tie, prefer non‑null sub_category
    // 3. If still tie, keep the smallest id
    let best = items[0];
    let bestScore = best.vol * 1000 + (best.sub ? 1 : 0) * 10 - best.id; // composite score
    items.forEach(it => {
      const score = it.vol * 1000 + (it.sub ? 1 : 0) * 10 - it.id;
      if(score > bestScore){
        best = it;
        bestScore = score;
      }
    });
    // Mark all others for deletion
    items.forEach(it => {
      if(it.id !== best.id) toDelete.push(it.id);
    });
  }

  console.log(`Found ${toDelete.length} duplicate rows to delete.`);
  if(toDelete.length===0){ console.log('Nothing to delete.'); return; }

  const batchSize = 50;
  for(let i=0;i<toDelete.length;i+=batchSize){
    const batch = toDelete.slice(i,i+batchSize);
    const {error: delErr, count} = await supabase.from('Books').delete().in('id', batch).select('id', {count:'exact'});
    if(delErr){ console.error('Delete error batch', i/batchSize+1, delErr.message); }
    else{ console.log(`Deleted batch ${i/batchSize+1}: ${count} rows`); }
  }
  console.log('Duplicate cleanup complete.');
}

cleanupDuplicates().catch(e=>console.error('Unexpected error:', e));
