import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalize(title) {
  // 1. Remove Urdu characters for a consistent English-only comparison key
  let t = title.replace(/[\u0600-\u06FF]/g, ' ').toLowerCase();
  // 2. Remove noise and noise phrases
  const noise = [/by\b.*/g, /mufti|maulana|taqi|usmani|khan|safdar|sheikh|shaykh|ul|hadith/g, /\b(ka|ki|ke|kay|o|wa|aur|e|the|a|an|al|ul)\b/g];
  noise.forEach(r => t = t.replace(r, ' '));
  // 3. Keep only alphanumeric and collapse spaces
  return t.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fixTaqi() {
  const { data, error } = await supabase.from('Books')
    .select('id,title,description,sub_category')
    .ilike('sub_category', '%mufti-muhammad-taqi-usmani%');
  
  if (error) { console.error(error); return; }
  console.log(`Checking ${data.length} books for Taqi Usmani...`);

  const groups = {};
  data.forEach(b => {
    const core = normalize(b.title);
    if (!groups[core]) groups[core] = [];
    groups[core].push(b);
  });

  const toDelete = [];
  for (const [core, items] of Object.entries(groups)) {
    if (items.length < 2) continue;
    
    console.log(`\nCore [${core}] - Items: ${items.length}`);
    let best = items[0];
    items.forEach(it => {
      // Prioritize by volume count (looking for "volumes" in description)
      const v1 = (JSON.parse(best.description || '[]').volumes || []).length;
      const v2 = (JSON.parse(it.description || '[]').volumes || []).length;
      if (v2 > v1 || (v2 === v1 && it.id > best.id)) {
        best = it;
      }
    });

    console.log(`  Keeping ID ${best.id}: ${best.title}`);
    items.forEach(it => {
      if (it.id !== best.id) {
        toDelete.push(it.id);
        console.log(`  Removing ID ${it.id}: ${it.title}`);
      }
    });
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} records...`);
    await supabase.from('Books').delete().in('id', toDelete);
    console.log('Deleted.');
  } else {
    console.log('No duplicates found in this specific scholar check.');
  }
}

fixTaqi().catch(e => console.error(e));
