import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main(){
  const since = new Date(Date.now() - 1000*60*60*6).toISOString(); // last 6 hours
  console.log('Fetching books updated since', since);
  const { data, error } = await supabase.from('Books').select('id,title,author,cover_url,updated_at').gte('updated_at', since).order('updated_at', {ascending:false}).limit(1000);
  if(error){ console.error('Supabase error', error); process.exit(1); }
  console.log('Found', data.length, 'recent updates');
  const jsonPath = 'updated_covers.json';
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  // write CSV
  const csv = ['id,title,author,cover_url,updated_at', ...data.map(d=>`${d.id},"${(d.title||'').replace(/"/g,'""')}","${(d.author||'').replace(/"/g,'""')}",${d.cover_url || ''},${d.updated_at || ''}`)].join('\n');
  fs.writeFileSync('updated_covers.csv', csv);
  console.log('Wrote updated_covers.json and updated_covers.csv');
}

main().catch(e=>{console.error(e); process.exit(1);});
