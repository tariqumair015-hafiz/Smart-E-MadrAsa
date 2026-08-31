import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');

const fixes = [
  {
    match: 'Khulasa Musnad',
    cover: 'https://besturdubooks.net/wp-content/uploads/2021/12/Musnad_Ul_Imam_Azam_Al_Bushra.jpg'
  },
  {
    match: 'Sharh Urdu Matn ul Kafi',
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/sharh-urdu-matn-ul-kafi1.jpg'
  },
];

const { data: books } = await sb.from('Books').select('id,title').eq('category', 'درجہ سادسہ');
for (const f of fixes) {
  const matched = books.filter(b => b.title.toLowerCase().includes(f.match.toLowerCase()));
  for (const b of matched) {
    const { error } = await sb.from('Books').update({ cover_url: f.cover }).eq('id', b.id);
    console.log(error ? `❌ ${b.title.substring(0,50)}` : `✅ ${b.title.substring(0,50)}`);
  }
}
console.log('Done!');
