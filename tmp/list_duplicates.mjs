import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function volumeCount(desc){
  try{ const arr = JSON.parse(desc||'[]'); return Array.isArray(arr)?arr.length:0; }catch(e){return 0;}
}

async function listDuplicates(){
  const {data, error} = await supabase.from('Books').select('id,title,description,sub_category').order('title');
  if(error){ console.error('fetch error', error); return; }
  const groups = {};
  data.forEach(b=>{
    const key = b.title.trim();
    if(!groups[key]) groups[key]=[];
    groups[key].push({id:b.id, sub:b.sub_category, vol:volumeCount(b.description)});
  });
  const dup = Object.entries(groups).filter(([,arr])=>arr.length>1);
  console.log('Duplicate titles count:', dup.length);
  dup.forEach(([title, items])=>{
    console.log('---', title);
    items.forEach(i=> console.log(` id:${i.id} sub:${i.sub} volCount:${i.vol}`));
  });
}

listDuplicates().catch(e=>console.error(e));
