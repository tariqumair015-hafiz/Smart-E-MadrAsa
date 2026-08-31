import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function volumeCount(desc){
  try{ const arr = JSON.parse(desc||'[]'); return Array.isArray(arr)?arr.length:0; }catch(e){return 0;}
}

function normalize(title) {
  // 1. Remove Urdu characters for a consistent English-only comparison key
  let t = title.replace(/[\u0600-\u06FF]/g, ' ').toLowerCase();
  // 2. Remove noise and common author names/titles
  const noise = [/by\b.*/g, /mufti|maulana|taqi|usmani|khan|safdar|sheikh|shaykh|ul|hadith|palanpuri|ahmad|saeed/g, /\b(ka|ki|ke|kay|o|wa|aur|e|the|a|an|al|ul|and)\b/g];
  noise.forEach(r => t = t.replace(r, ' '));
  // 3. Keep only alphanumeric and collapse spaces
  return t.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchAllBooks() {
  const allBooks = [];
  let from = 0;
  const pageSize = 1000;
  while(true) {
    const { data, error } = await supabase.from('Books').select('*').range(from, from + pageSize - 1);
    if (error) { console.error('Fetch error:', error.message); break; }
    if (!data || data.length === 0) break;
    allBooks.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allBooks;
}

async function hyperCleanup(){
  const books = await fetchAllBooks();
  console.log(`Total books fetched: ${books.length}`);

  // Grouping criteria: same Scholar (sub_category) AND same normalized core title
  const groups = {};
  books.forEach(b => {
    // We only care about books that belong to a scholar (sub_category after Palanpuri check is done in fetch context or we filter)
    const scholarId = b.sub_category || 'other';
    const core = normalize(b.title);
    if (!core) return;

    const key = `${scholarId}|${core}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });

  const toDelete = [];
  for (const [key, items] of Object.entries(groups)) {
    if (items.length < 2) continue;

    console.log(`\nGroup [${key}]: ${items.length} items`);
    // Rule: pick the record with most volumes, then highest ID (most recent)
    let best = items[0];
    let bestV = volumeCount(best.description);
    
    items.forEach(it => {
      const v = volumeCount(it.description);
      // Tie-breaking: more volumes wins; if equal, newer ID (likely higher quality rescrape)
      if (v > bestV || (v === bestV && it.id > best.id)) {
        best = it;
        bestV = v;
      }
    });

    console.log(`  Keeping ID: ${best.id} [${best.title}] (Vol: ${bestV})`);
    
    items.forEach(it => {
      if (it.id !== best.id) {
        toDelete.push(it.id);
        console.log(`  Deleting ID: ${it.id} [${it.title}] (Vol: ${volumeCount(it.description)})`);
      }
    });
  }

  console.log(`\nTotal scheduled for deletion: ${toDelete.length}`);
  if (toDelete.length === 0) { console.log('Nothing to delete.'); return; }

  const batchSize = 50;
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    console.log(`Deleting batch ${Math.floor(i/batchSize) + 1}...`);
    const { error: delErr } = await supabase.from('Books').delete().in('id', batch);
    if (delErr) console.error('Delete error:', delErr.message);
  }
  console.log('Hyper cleanup COMPLETE.');
}

hyperCleanup().catch(e => console.error(e));
