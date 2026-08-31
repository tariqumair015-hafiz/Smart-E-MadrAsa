import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const category = 'درجہ سادسہ';

const verifiedCovers = [
  {
    terms: ['Jalalain', 'جلالین'],
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Tafseer-Ul-Jalalain.jpg'
  },
  {
    terms: ['Fauz ul Kabeer', 'الفوز الکبیر'],
    url: 'https://besturdubooks.net/wp-content/uploads/2021/11/Al-Fawz-ul-Kabeer-Al-Bushra.jpg'
  },
  {
    terms: ['Khair ul Usool', 'خیر الاصول'],
    url: 'https://besturdubooks.net/wp-content/uploads/2024/05/Mueen_ul_Usool.jpg'
  },
  {
    terms: ['Siraji', 'سراجی'],
    url: 'https://besturdubooks.net/wp-content/uploads/2017/09/TARAZI_SHARH_SIRAJI.jpg'
  },
  {
    terms: ['Kitab ul Aasar', 'Athar', 'الآثار'],
    url: 'https://besturdubooks.net/wp-content/uploads/2025/10/AL_MUKHTAR_SHARH_KITAB_UL_ATHAAR.jpg'
  },
  {
    terms: ['Hidayah', 'Hidaya', 'ہدایہ'],
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Hidayah.jpg'
  },
  {
    terms: ['Tauzeeh', 'توضیح'],
    url: 'https://besturdubooks.net/wp-content/uploads/2022/01/AL_TAOZEEH_Al_TALWEEH-NOOR-MUHAMMAD.jpg'
  },
  {
    terms: ['Sharh Aqaid', 'عقائد', 'Aqaid'],
    url: 'https://besturdubooks.net/wp-content/uploads/2013/09/AL-AQAID-UN-NASAFIA-AL-FAWAID-UL-IMDADIYA.jpg'
  },
  {
    terms: ['Deoband', 'دیوبند'],
    url: 'https://besturdubooks.net/wp-content/uploads/2025/02/ULAMA_E_DEOBAND_KA_DEENI_RUKH_MASLAKI_MIZAJ.jpg'
  },
  {
    terms: ['Falkiyat', 'فلکیات'],
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/fahm-ul-falkiyaat.jpg'
  },
  {
    terms: ['Hamasa', 'حماسہ'],
    url: 'https://besturdubooks.net/wp-content/uploads/2022/08/Dewan-Ul-Hamasa.jpg'
  },
  {
    terms: ['Kafi', 'کافی'],
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/sharh-urdu-matn-ul-kafi1.jpg'
  },
  {
    terms: ['Musnad', 'مسند', 'Azam'],
    url: 'https://besturdubooks.net/wp-content/uploads/2021/12/Musnad_Ul_Imam_Azam_Al_Bushra.jpg'
  },
  {
    terms: ['Aqeeda', 'Aqidah', 'Tahawia', 'Tahawiah', 'طحاویہ'],
    url: 'https://besturdubooks.net/wp-content/uploads/2018/10/matn-ul-aqeeda-al-tahawiah.jpg'
  }
];

async function fix() {
  console.log('Fixing 6th Year covers with verified links...');
  
  const { data: books } = await supabase.from('Books').select('id, title, sub_category').eq('category', category);
  
  for (const book of books) {
    const t = book.title.toLowerCase();
    
    // Find the best matching verified cover
    // We prioritize textbooks
    if (book.sub_category === 'درسی کتب') {
       const match = verifiedCovers.find(vc => vc.terms.some(term => t.includes(term.toLowerCase())));
       if (match) {
          console.log(`Matching Core: ${book.title} -> ${match.url}`);
          await supabase.from('Books').update({ cover_url: match.url }).eq('id', book.id);
          continue;
       }
    }
    
    // Also fix mismatch for commentaries if they have placeholder or bad covers
    // Like Musnad Imam Azam (user pointed out mismatch)
    const match = verifiedCovers.find(vc => vc.terms.some(term => t.includes(term.toLowerCase())));
    if (match) {
       console.log(`Matching Commentary/Other: ${book.title} -> ${match.url}`);
       await supabase.from('Books').update({ cover_url: match.url }).eq('id', book.id);
    }
  }
  
  console.log('Done.');
}

fix();
