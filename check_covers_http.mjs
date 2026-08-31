import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCoverUrls(limit = 2000) {
  const { data, error } = await supabase.from('Books').select('id,title,cover_url').neq('cover_url','').limit(limit);
  if (error) {
    console.error('Supabase error:', error.message);
    return;
  }
  let bad = [];
  for (const b of data) {
    try {
      const response = await fetch(b.cover_url, { method: 'HEAD' });
      if (!response.ok) {
        bad.push({ id: b.id, title: b.title, url: b.cover_url, status: response.status });
      }
    } catch (e) {
      bad.push({ id: b.id, title: b.title, url: b.cover_url, err: e.message });
    }
  }
  console.log('Total checked:', data.length);
  console.log('Bad cover URLs count:', bad.length);
  bad.slice(0, 20).forEach(item => console.log(item));
}

checkCoverUrls();
