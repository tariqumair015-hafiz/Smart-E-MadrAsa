import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function volumeCount(desc){
  try{ const arr = JSON.parse(desc||'[]'); return Array.isArray(arr)?arr.length:0; }catch(e){return 0;}
}

async function fetchAllBooks() {
  const allBooks = [];
  let from = 0;
  const pageSize = 1000;
  while(true) {
    console.log(`Fetching rows ${from} to ${from + pageSize - 1}...`);
    const { data, error } = await supabase
      .from('Books')
      .select('id,title,description,sub_category')
      .range(from, from + pageSize - 1);
    
    if (error) {
      console.error('Fetch error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    
    allBooks.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allBooks;
}

async function cleanupDuplicates(){
  const books = await fetchAllBooks();
  console.log(`Total books fetched: ${books.length}`);

  // Group by fuzzy title
  const groups = {};
  books.forEach(b => {
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
    
    // Choose the best record: highest volume count > non-null sub_category > smallest id
    let best = items[0];
    let bestScore = best.vol * 1000000 + (best.sub ? 100000 : 0) - best.id;
    
    items.forEach(it => {
      const score = it.vol * 1000000 + (it.sub ? 100000 : 0) - it.id;
      if(score > bestScore){
        best = it;
        bestScore = score;
      }
    });

    // Mark all others for deletion
    items.forEach(it => {
      if(it.id !== best.id) {
        toDelete.push(it.id);
        console.log(`Marked for deletion: ID ${it.id} [${it.title}] keeping ID ${best.id}`);
      }
    });
  }

  console.log(`\nFound ${toDelete.length} total duplicate rows to delete.`);
  if(toDelete.length === 0){ console.log('Nothing to delete.'); return; }

  const batchSize = 50;
  for(let i=0; i<toDelete.length; i+=batchSize){
    const batch = toDelete.slice(i, i+batchSize);
    console.log(`Deleting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(toDelete.length/batchSize)}...`);
    const { error: delErr } = await supabase.from('Books').delete().in('id', batch);
    if(delErr){ console.error('Delete error:', delErr.message); }
  }
  console.log('Cleanup complete.');
}

cleanupDuplicates().catch(e=>console.error('Unexpected error:', e));
