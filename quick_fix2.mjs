import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');
const CAT = 'درجہ سادسہ';

const fixes = [
  { match: 'Ain ul Hidaya', cover: 'https://besturdubooks.net/wp-content/uploads/2021/09/Eain-Ul-Hidaya-Urdu-Sharh-Al-Hidaya.jpg' },
  { match: 'Khulasa Musnad', cover: 'https://besturdubooks.net/wp-content/uploads/2021/12/Musnad-Imam-Azam-Urdu.jpg' },
];

const { data: books } = await sb.from('Books').select('id,title').eq('category', CAT);
for (const f of fixes) {
  const matched = books.filter(b => b.title.toLowerCase().includes(f.match.toLowerCase()));
  for (const b of matched) {
    await sb.from('Books').update({ cover_url: f.cover }).eq('id', b.id);
    console.log(`✅ ${b.title.substring(0,60)}`);
  }
}
console.log('Done!');
