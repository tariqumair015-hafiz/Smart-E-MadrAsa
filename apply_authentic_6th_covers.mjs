import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const category = 'درجہ سادسہ';

const updates = [
  {
    search: 'Tauzeeh',
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tanqeeh-u-Tauzeeh.jpg'
  },
  {
    search: 'Sharh Aqaid',
    url: 'https://besturdubooks.net/wp-content/uploads/2025/01/SHARHUL_AQAID.jpg'
  },
  {
    search: 'Deoband',
    url: 'https://besturdubooks.net/wp-content/uploads/2020/09/Ulema-e-Deoband-Ka-Deeni-Rukh-Aur-Maslaki-Mizaj.jpg'
  },
  {
    search: 'Falkiyat',
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Dars-e-Falkeyat.jpg'
  },
  {
    search: 'Jalalain',
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tafseer-Ul-Jalalain.jpg'
  },
  {
    search: 'Asar',
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Kitab-ul-Asar.jpg'
  },
  {
    search: 'Siraji',
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/AlSirajiFilMeras.jpg'
  }
];

async function applyFixes() {
  for (const up of updates) {
    console.log(`Applying cover for: ${up.search}`);
    const { error } = await supabase.from('Books')
      .update({ cover_url: up.url })
      .ilike('title', `%${up.search}%`)
      .eq('category', category)
      .eq('sub_category', 'درسی کتب');
      
    if (error) console.log(`Error updating ${up.search}: ${error.message}`);
    else console.log(`Success: ${up.search}`);
  }
  console.log('All updates attempted.');
}

applyFixes();
