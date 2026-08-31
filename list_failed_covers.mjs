import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function urlIsImage(url){
  if(!url) return false;
  try{ const res = await fetch(url, { method: 'HEAD', redirect: 'follow' }); if(!res.ok) return false; const ct = res.headers.get('content-type') || ''; return ct.startsWith('image/'); }catch(e){ return false; }
}

async function main(){
  console.log('Listing books with missing or broken cover URLs...');
  const { data: books, error } = await supabase.from('Books').select('id,title,author,cover_url').limit(5000);
  if(error){ console.error('Supabase error', error); return; }
  const bad = [];
  for(const b of books){
    if(!b.cover_url){ bad.push({id:b.id,title:b.title,author:b.author,reason:'no-url'}); continue; }
    const ok = await urlIsImage(b.cover_url);
    if(!ok) bad.push({id:b.id,title:b.title,author:b.author,reason:'bad-url',cover_url:b.cover_url});
  }
  console.log('Total bad:', bad.length);
  bad.slice(0,200).forEach(x => console.log(JSON.stringify(x)));
}

main().catch(e=>{console.error(e);process.exit(1);});
