import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const LOG_PATH = 'c:\\Users\\ut304\\AppData\\Roaming\\Code\\User\\workspaceStorage\\20943783b116db585d580e24ed5cd99b\\GitHub.copilot-chat\\chat-session-resources\\67245807-f535-4aee-97ca-0babf2c15a41\\call_Drn0fHYhOBd2Eg0Wq937716C__vscode-1775129017193\\content.txt';
const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publish
apna plan batao kya krna hai ?

Workingable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

function extractFoundImages(lines){
  const imgs = [];
  for(const line of lines){
    const m = line.match(/Found image:\s*(https?:\/\/\S+)/);
    if(m) imgs.push(m[1]);
  }
  return imgs;
}
function extractUpdatedIds(lines){
  const ids = [];
  for(const line of lines){
    const m = line.match(/Updated book id\s+(\d+)/);
    if(m) ids.push(m[1]);
  }
  return ids;
}

async function main(){
  const txt = fs.readFileSync(LOG_PATH, 'utf8');
  const lines = txt.split(/\r?\n/);
  const imgs = extractFoundImages(lines);
  const ids = extractUpdatedIds(lines);
  console.log('Found images:', imgs.length, 'Updated ids:', ids.length);
  const pairs = [];
  const n = Math.min(imgs.length, ids.length);
  for(let i=0;i<n;i++) pairs.push({id: ids[i], new_cover: imgs[i]});

  // fetch titles/authors from DB for these ids
  const idsNum = pairs.map(p=>p.id);
  const { data: books, error } = await supabase.from('Books').select('id,title,author,cover_url').in('id', idsNum);
  if(error){ console.error('Supabase error', error); return; }
  const byId = {};
  for(const b of books) byId[String(b.id)] = b;

  const rows = pairs.map(p=>({
    id: p.id,
    title: byId[p.id]?.title || '',
    author: byId[p.id]?.author || '',
    old_cover: byId[p.id]?.cover_url || '',
    new_cover: p.new_cover
  }));

  fs.writeFileSync('recent_updates_mapped.json', JSON.stringify(rows, null,2));
  // CSV
  const csv = ['id,title,author,old_cover,new_cover', ...rows.map(r=>`${r.id},"${(r.title||'').replace(/"/g,'""')}","${(r.author||'').replace(/"/g,'""')}","${(r.old_cover||'')}","${(r.new_cover||'')}"`)].join('\n');
  fs.writeFileSync('recent_updates_mapped.csv', csv);
  console.log('Wrote recent_updates_mapped.json and .csv');
}

main().catch(e=>{console.error(e); process.exit(1);});
