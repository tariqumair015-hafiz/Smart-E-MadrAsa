import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sampleCovers(limit=20){
  const {data,error}=await supabase.from('Books').select('id,title,cover_url').order('id', {ascending:true}).limit(limit);
  if(error){console.error('Error',error.message);return;}
  data.forEach(b=> console.log(`${b.id}\t${b.title}\t${b.cover_url}`));
}

sampleCovers();
