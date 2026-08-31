import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function urlIsImage(url){
  if(!url) return false;
  try{
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if(!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/');
  }catch(e){
    return false;
  }
}

function archiveSearchUrl(q){
  return `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&fl[]=identifier,description,title,creator&rows=5&page=1&output=json`;
}

async function searchArchiveByTitle(title){
  try{
    const q1 = `title:(\"${title}\")`;
    const res1 = await fetch(archiveSearchUrl(q1));
    if(res1.ok){
      const json = await res1.json();
      if(json.response && json.response.docs && json.response.docs.length){
        return json.response.docs.map(d=>d.identifier);
      }
    }
    // fallback: simple title words
    const q2 = title.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
    const res2 = await fetch(archiveSearchUrl(q2));
    if(res2.ok){
      const json2 = await res2.json();
      if(json2.response && json2.response.docs && json2.response.docs.length){
        return json2.response.docs.map(d=>d.identifier);
      }
    }
  }catch(e){}
  return [];
}

async function archiveCoverById(id){
  if(!id) return null;
  const url = `https://archive.org/services/img/${id}`;
  const ok = await urlIsImage(url);
  return ok ? url : null;
}

async function main(){
  console.log('Searching archive.org for missing covers...');
  const { data: books, error } = await supabase.from('Books').select('id,title,author,cover_url,pdf_url').limit(2000);
  if(error){ console.error('Supabase select error', error); return; }

  const broken = [];
  for(const b of books){
    const ok = b.cover_url && await urlIsImage(b.cover_url);
    if(!ok) broken.push(b);
  }
  console.log('Broken count:', broken.length);

  const updated = [];
  const manual = [];

  for(const b of broken){
    const title = b.title || '';
    console.log('\nProcessing:', title);
    let found = null;

    // try archive by title
    const ids = await searchArchiveByTitle(title);
    for(const id of ids){
      const cover = await archiveCoverById(id);
      if(cover){ found = cover; break; }
    }

    // try using pdf_url identifier
    if(!found && b.pdf_url){
      const m = b.pdf_url.match(/archive.org\/(?:details|download|stream)\/([^\/?#]+)/i);
      if(m){
        const cover = await archiveCoverById(m[1]);
        if(cover) found = cover;
      }
    }

    if(found){
      console.log('  → Found archive cover:', found);
      const { error } = await supabase.from('Books').update({ cover_url: found }).eq('id', b.id);
      if(!error) updated.push({id: b.id, title, source: 'archive', url: found});
      else console.error('  !! update error', error);
      continue;
    }

    manual.push({id: b.id, title, author: b.author});
  }

  console.log('\nDone. Updated:', updated.length, 'Needs manual:', manual.length);
  if(updated.length) console.table(updated.slice(0,50));
  if(manual.length) console.table(manual.slice(0,50));
}

main().catch(e=>{ console.error(e); process.exit(1); });
