import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function urlIsImage(url){
  try{
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' , timeout: 10000});
    if(!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.startsWith('image/');
  }catch(e){
    return false;
  }
}

function besturduSearchUrl(query){
  const q = encodeURIComponent(query);
  return `https://besturdubooks.net/?s=${q}`;
}

async function findCoverOnBestUrdu(title){
  const url = besturduSearchUrl(title);
  const res = await fetch(url, { redirect: 'follow' });
  if(!res.ok) return null;
  const html = await res.text();

  // Simple regex to find first <img ...src="..."> occurrence
  const imgMatch = html.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
  if(imgMatch && imgMatch[1]){
    let src = imgMatch[1];
    // handle protocol-relative URLs
    if(src.startsWith('//')) src = 'https:' + src;
    return src;
  }
  // try data-src
  const dataSrcMatch = html.match(/<img[^>]+data-src=["']?([^"' >]+)["']?/i);
  if(dataSrcMatch && dataSrcMatch[1]) return dataSrcMatch[1];
  return null;
}

async function main(){
  console.log('🔎 Scanning books for broken cover images...');
  const { data: books, error } = await supabase.from('Books').select('id,title,author,cover_url').limit(1000);
  if(error){ console.error('Supabase select error', error); return; }

  const broken = [];
  for(const b of books){
    if(!b.cover_url){
      broken.push({book:b, reason: 'no-url'});
      continue;
    }
    const ok = await urlIsImage(b.cover_url);
    if(!ok){
      broken.push({book:b, reason: 'bad-url'});
    }
  }

  console.log(`Found ${broken.length} books with missing/broken covers.`);
  if(broken.length === 0) return;

  const updates = [];
  for(const item of broken){
    const title = item.book.title || '';
    console.log(`\nSearching besturdubooks for: ${title}`);
    const found = await findCoverOnBestUrdu(title);
    if(found){
      console.log('  → Found image:', found);
      updates.push({ id: item.book.id, cover_url: found });
    } else {
      console.log('  → No cover found on besturdubooks for this title.');
    }
  }

  if(updates.length === 0){
    console.log('\nNo updates found. Manual review required for remaining titles.');
  } else {
    console.log(`\nUpdating ${updates.length} records in Supabase...`);
    for(const u of updates){
      const { error: upErr } = await supabase.from('Books').update({ cover_url: u.cover_url }).eq('id', u.id);
      if(upErr) console.error('Update error for', u.id, upErr);
      else console.log('Updated book id', u.id);
    }
  }

  console.log('\nDone.');
}

main().catch(e=>{console.error(e); process.exit(1);});
