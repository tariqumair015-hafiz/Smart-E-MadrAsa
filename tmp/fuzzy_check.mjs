import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listBooks(scholarId) {
  console.log(`Checking scholar: ${scholarId}`);
  const { data, error } = await supabase
    .from('Books')
    .select('id,title,description,sub_category')
    .ilike('sub_category', `%${scholarId}%`);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total books fetched: ${data.length}`);
  
  const groups = {};
  data.forEach(b => {
    console.log(`- ID: ${b.id}, Title: "${b.title}", Sub: ${b.sub_category}`);
    const key = b.title.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  
  const dups = Object.entries(groups).filter(([k, v]) => v.length > 1);
  console.log(`\nDuplicate groups by fuzzy title: ${dups.length}`);
  dups.forEach(([title, items]) => {
    console.log(`Fuzzy Title: "${title}"`);
    items.forEach(i => console.log(`  -> ID: ${i.id}, Original Title: "${i.title}"`));
  });
}

const sid = process.argv[2] || 'maulana-yusuf-ludhianvi';
listBooks(sid).catch(e => console.error(e));
