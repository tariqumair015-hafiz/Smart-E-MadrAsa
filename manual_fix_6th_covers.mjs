import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const updates = [
  {
    title: 'Tauzeeh Mukammal توضیح مکمل',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tauzeeh-Mukammal.jpg'
  },
  {
    title: 'Ulama e Deoband Ka Deeni Rukh علماء دیوبند کا دینی رخ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2020/09/Ulama-e-Deoband-Ka-Deeni-Rukh.jpg'
  },
  {
    title: 'Dars e Falkiyat درس فلکیات',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Dars-e-Falkiyat.jpg'
  },
  {
    title: 'Sharh Aqaid شرح عقائد',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Sharh-ul-Aqaid.jpg'
  },
  {
    title: 'Tafseer e Jalalain تفسیر جلالین',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tafseer-Jalalain.jpg'
  },
  {
     title: 'Al Fauzul Kabeer الفوز الکبیر فی اصول التفسیر',
     cover_url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Fauzul-Kabeer.jpg'
  }
];

async function fix() {
  for (const item of updates) {
    console.log(`Fixing cover for: ${item.title}`);
    const { error } = await supabase.from('Books')
      .update({ cover_url: item.cover_url })
      .ilike('title', `%${item.title.split(' ')[0]}%`)
      .eq('category', 'درجہ سادسہ')
      .eq('sub_category', 'درسی کتب');
      
    if (error) console.log(`Error updating ${item.title}: ${error.message}`);
    else console.log(`Successfully updated ${item.title}`);
  }
}

fix();
