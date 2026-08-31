import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function urlIsImage(url){
  try{
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if(!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/');
  }catch(e){
    return false;
  }
}

function variants(url){
  const res = [];
  // remove size suffix like -200x300
  res.push(url.replace(/-\d+x\d+(?=\.[a-zA-Z]{3,4}$)/, ''));
  // try removing -200x300.jpg and adding .jpg
  res.push(url.replace(/-\d+x\d+\.(jpg|png|jpeg)$/i, '.$1'));
  // try https/http flip
  if(url.startsWith('http:')) res.push(url.replace('http:', 'https:'));
  if(url.startsWith('https:')) res.push(url.replace('https:', 'http:'));
  // try removing query string
  res.push(url.split('?')[0]);
  return Array.from(new Set(res));
}

async function main(){
  console.log('🔧 Repairing BestUrdu thumbnail URLs...');
  const { data: books, error } = await supabase.from('Books').select('id,title,author,cover_url').like('cover_url','%besturdubooks.net%').limit(1000);
  if(error){ console.error('Supabase select error', error); return; }
  let fixed = 0;
  for(const b of books){
    if(!b.cover_url) continue;
    const ok = await urlIsImage(b.cover_url);
    if(ok) continue;
    const vs = variants(b.cover_url);
    let found = null;
    for(const v of vs){
      const ok2 = await urlIsImage(v);
      if(ok2){ found = v; break; }
    }
    if(found){
      const { error: up } = await supabase.from('Books').update({ cover_url: found }).eq('id', b.id);
      if(up){ console.error('Update error', b.id, up); }
      else { fixed++; console.log('Fixed', b.id, b.title, '→', found); }
    }
  }
  console.log(`Done. Fixed ${fixed} records.`);
}

main().catch(e=>{console.error(e); process.exit(1);});
