import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const category = 'درجہ رابعہ';

async function fix() {
  console.log('Fixing Sharh Jami to be Textbook...');
  // Force "Sharh Jami" versions matching our text to be textbooks
  const {error: e1} = await supabase.from('Books')
    .update({sub_category: 'درسی کتب'})
    .eq('category', category)
    .ilike('title', '%sharh e jami al bushra%');
  if(!e1) console.log('Fixed Sharh Jami Al Bushra');
  
  const {error: e2} = await supabase.from('Books')
    .update({sub_category: 'درسی کتب'})
    .eq('category', category)
    .ilike('title', '%sharh jami uloom%');
  if(!e2) console.log('Fixed Sharh Jami Uloom Islamia');

  console.log('Injecting Missing Core Textbooks from Archive.org...');
  
  const missingBooks = [
    {
      title: 'Kanz ud Daqaiq كنـز الـدقـائـق',
      sub_category: 'درسی کتب',
      pdf_url: 'https://archive.org/download/kanz-ud-daqaiq/Kanz-Ud-Daqaiq_Maktaba-Al-Bushra.pdf',
      cover_url: 'https://archive.org/services/img/kanz-ud-daqaiq',
      volumes: [{title: 'Download', url: 'https://archive.org/download/kanz-ud-daqaiq/Kanz-Ud-Daqaiq_Maktaba-Al-Bushra.pdf'}]
    },
    {
      title: 'Noor ul Anwar نـور الانـوار',
      sub_category: 'درسی کتب',
      pdf_url: 'https://archive.org/download/Noor-ul-Anwar-Bushra/Noor-ul-Anwar--Maktabat-ul-Bushra.pdf',
      cover_url: 'https://archive.org/services/img/Noor-ul-Anwar-Bushra',
      volumes: [{title: 'Download', url: 'https://archive.org/download/Noor-ul-Anwar-Bushra/Noor-ul-Anwar--Maktabat-ul-Bushra.pdf'}]
    },
    {
      title: 'Maqamat e Hariri مـقامات حـریری',
      sub_category: 'درسی کتب',
      pdf_url: 'https://archive.org/download/Maqamat0E-Hariri/Maqamat0E-Hariri-Vol1-2.pdf',
      cover_url: 'https://archive.org/services/img/Maqamat0E-Hariri',
      volumes: [{title: 'Download', url: 'https://archive.org/download/Maqamat0E-Hariri/Maqamat0E-Hariri-Vol1-2.pdf'}]
    },
    {
      title: 'Al Balaghat ul Wazeha البلاغۃ الواضحۃ',
      sub_category: 'درسی کتب',
      pdf_url: 'https://archive.org/download/AlBalaghatUlWaziha/AlBalaghatUlWaziha.pdf',
      cover_url: 'https://archive.org/services/img/AlBalaghatUlWaziha',
      volumes: [{title: 'Download', url: 'https://archive.org/download/AlBalaghatUlWaziha/AlBalaghatUlWaziha.pdf'}]
    }
  ];

  for(const b of missingBooks) {
    // Check if we already injected
    const {data} = await supabase.from('Books').select('id').eq('title', b.title);
    if(data && data.length > 0) {
      console.log('Skipping ' + b.title + ' (Already exists)');
      continue;
    }
    
    const dbBook = {
      title: b.title,
      author: 'Maktaba Al Bushra',
      category: category,
      sub_category: b.sub_category,
      cover_url: b.cover_url,
      pdf_url: b.pdf_url,
      description: JSON.stringify(b.volumes),
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0,
    };

    const {error: insErr} = await supabase.from('Books').insert([dbBook]);
    if(insErr) console.log('Err inserting ' + b.title + ': ' + insErr.message);
    else console.log('Successfully inserted: ' + b.title);
  }
}

fix();
