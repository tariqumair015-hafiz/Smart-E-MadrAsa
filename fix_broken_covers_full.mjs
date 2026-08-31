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

function besturduSearchUrl(query){
  return `https://besturdubooks.net/?s=${encodeURIComponent(query)}`;
}

async function findCoverOnBestUrdu(title){
  try{
    const url = besturduSearchUrl(title);
    const res = await fetch(url, { redirect: 'follow' });
    if(!res.ok) return null;
    const html = await res.text();
    const imgMatch = html.match(/<img[^>]+src=["']?([^"' >]+)["']?/i);
    if(imgMatch && imgMatch[1]){
      let src = imgMatch[1];
      if(src.startsWith('//')) src = 'https:' + src;
      return src;
    }
    const dataSrcMatch = html.match(/<img[^>]+data-src=["']?([^"' >]+)["']?/i);
    if(dataSrcMatch && dataSrcMatch[1]) return dataSrcMatch[1];
  }catch(e){ }
  return null;
}

function variants(url){
  if(!url) return [];
  const out = new Set();
  out.add(url);
  // remove size suffix like -200x300
  out.add(url.replace(/-\d+x\d+(?=\.[a-zA-Z]{3,4}$)/, ''));
  out.add(url.replace(/-\d+x\d+\.(jpg|png|jpeg)$/i, '.$1'));
  out.add(url.split('?')[0]);
  if(url.startsWith('http:')) out.add(url.replace('http:', 'https:'));
  if(url.startsWith('https:')) out.add(url.replace('https:', 'http:'));
  return Array.from(out);
}

function extractArchiveId(url){
  if(!url) return null;
  // match /details/ID or /stream/ID
  const m = url.match(/archive.org\/(?:details|stream)\/([^\/?#]+)/i);
  if(m) return m[1];
  // also sometimes direct file urls with /download/ID/...
  const m2 = url.match(/archive.org\/.+?\/(?:download|download)\/([^\/?#]+)/i);
  if(m2) return m2[1];
  return null;
}

async function archiveCoverById(id){
  if(!id) return null;
  const url = `https://archive.org/services/img/${id}`;
  try{
    const ok = await urlIsImage(url);
    if(ok) return url;
  }catch(e){}
  return null;
}

async function process(){
  console.log('Running full fixer: besturdubooks + variants + archive.org');
  const { data: books, error } = await supabase.from('Books').select('id,title,author,cover_url,pdf_url').limit(2000);
  if(error){ console.error('Supabase select error', error); return; }

  const broken = [];
  for(const b of books){
    const ok = b.cover_url && await urlIsImage(b.cover_url);
    if(!ok) broken.push(b);
  }
  console.log('Broken count:', broken.length);

  const updated = [];
  const needsManual = [];

  for(const b of broken){
    const title = b.title || '';
    console.log('\n==', title);

    // 1) try besturdubooks search
    const found = await findCoverOnBestUrdu(title);
    if(found && await urlIsImage(found)){
      console.log('Found on besturdubooks:', found);
      const { error } = await supabase.from('Books').update({ cover_url: found }).eq('id', b.id);
      if(!error) updated.push({id: b.id, title, source: 'besturdubooks', url: found});
      else console.error('Update error', error);
      continue;
    }

    // 2) try variants of existing cover_url
    const vlist = variants(b.cover_url);
    let okv = null;
    for(const v of vlist){
      if(await urlIsImage(v)){ okv = v; break; }
    }
    if(okv){
      console.log('Found variant:', okv);
      const { error } = await supabase.from('Books').update({ cover_url: okv }).eq('id', b.id);
      if(!error) updated.push({id: b.id, title, source: 'variant', url: okv});
      else console.error('Update error', error);
      continue;
    }

    // 3) try archive.org if pdf_url points to archive
    const aid = extractArchiveId(b.pdf_url) || extractArchiveId(b.cover_url);
    if(aid){
      const arch = await archiveCoverById(aid);
      if(arch){
        console.log('Found archive cover:', arch);
        const { error } = await supabase.from('Books').update({ cover_url: arch }).eq('id', b.id);
        if(!error) updated.push({id: b.id, title, source: 'archive', url: arch});
        else console.error('Update error', error);
        continue;
      }
    }

    // 4) try searching title again with stripped punctuation
    const altFound = await findCoverOnBestUrdu(title.replace(/[^\w\s\u0600-\u06FF]/g, ' '));
    if(altFound && await urlIsImage(altFound)){
      console.log('Found alt search:', altFound);
      const { error } = await supabase.from('Books').update({ cover_url: altFound }).eq('id', b.id);
      if(!error) updated.push({id: b.id, title, source: 'besturdu-alt', url: altFound});
      else console.error('Update error', error);
      continue;
    }

    // else mark for manual
    needsManual.push({id: b.id, title, author: b.author});
  }

  console.log('\nDone. Updated:', updated.length, 'Needs manual:', needsManual.length);
  if(updated.length) console.table(updated.slice(0,50));
  if(needsManual.length) console.table(needsManual.slice(0,50));
}

process().catch(e=>{ console.error(e); process.exit(1); });
