import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CATEGORY = 'درجہ سادسہ';

// Verified from browser: each entry has multiple candidate URLs to try
// First working one will be applied
const bookCovers = [
  {
    matches: ['Kitab ul Faraiz', 'Asan Siraji', 'کتاب الفرائض آسان'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2023/02/KITAB_UL_FARAIZ_ASAN_SIRAJI.jpg',
      'https://besturdubooks.net/wp-content/uploads/2022/02/KITAB_UL_FARAIZ_ASAN_SIRAJI.jpg',
      'https://besturdubooks.net/wp-content/uploads/2018/10/Kitab-ul-Faraiz-Asan-Siraji.jpg',
    ]
  },
  {
    matches: ['Sharh Aqaid', 'Sharh ul Aqaid', 'شرح العقائد'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2018/10/SHARH_UL_AQAID0.jpg',
      'https://besturdubooks.net/wp-content/uploads/2018/10/Sharh-ul-Aqaid.jpg',
      'https://besturdubooks.net/wp-content/uploads/2025/01/SHARHUL_AQAID.jpg',
    ]
  },
  {
    matches: ['Dars e Falkiyat', 'Dars e Falkeyat', 'درس فلکیات'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2018/10/Dars-e-Falkeyat.jpg',
      'https://besturdubooks.net/wp-content/uploads/2022/08/Dars-e-Falkeyat.jpg',
      'https://besturdubooks.net/wp-content/uploads/2018/10/fahm-ul-falkiyaat.jpg',
    ]
  },
  {
    matches: ['Dars e Musnad', 'درس مسند'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2021/12/DARS-E-MUSNAD-E-IMAM-AZAM-URDU.jpg',
      'https://new.asasulquran.com/wp-content/uploads/2020/08/DARS-E-MUSNAD-E-IMAM-AZAM1.jpg',
    ]
  },
  {
    // exact match needed: Musnad Imam Azam Urdu (not Dars e, not Sharh)
    matches: ['Musnad Imam Azam Urdu', 'مسند امام اعظم اردو'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2021/12/Musnad-Imam-Azam-Urdu.jpg',
      'https://besturdubooks.net/wp-content/uploads/2021/12/Musnad-Imam-Azam-Urdu-200x300.jpg',
    ]
  },
  {
    matches: ['Talkhees', 'Talkhīs', 'تلخیص', 'Falkiyaat'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2022/08/TALKHEES-UL-FALKIYAAT.jpg',
    ]
  },
  {
    matches: ['Taleeq ul Faseeh', 'التعلیق الفسیح'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2018/10/al-taleeq-ul-faseeh-urdu-sharh-al-taozeeh-wat-talweeh.jpg',
      'https://besturdubooks.net/wp-content/uploads/2024/01/AL_TALEEQ_UL_FASEEH.jpg',
      'https://besturdubooks.net/wp-content/uploads/2022/01/AL_TALEEQ_UL_FASEEH.jpg',
    ]
  },
  {
    matches: ['Asmaar ul Hidaya', 'اثمار الھدایہ', 'Asmaar'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2018/10/asmaar-ul-hidaya-urdu-sharh-al-hidaya.jpg',
      'https://besturdubooks.net/wp-content/uploads/2021/09/Asmaar-ul-Hidaya.jpg',
      'https://besturdubooks.net/wp-content/uploads/2021/09/Eain-Ul-Hidaya-Urdu-Sharh-Al-Hidaya.jpg',
    ]
  },
  // Extra books that may also be missing
  {
    matches: ['Misk ul Maleeh', 'مسک الملیح'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2024/05/Miskul_Maleeh.jpg',
      'https://besturdubooks.net/wp-content/uploads/2024/05/Miskul_Maleeh-200x300.jpg',
    ]
  },
  {
    matches: ['Tanqeeh ut Tashrih', 'تنقیح التشریح'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2024/05/Tanqeeh_al_Tashreeh.jpg',
    ]
  },
  {
    matches: ['Al Tarweeh', 'الترویح'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2024/05/Al_Tarweeh.jpg',
    ]
  },
  {
    matches: ['Dars E Talweeh', 'Dars e Talweeh', 'درس تلویح'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2024/05/Dars_e_Talweeh.jpg',
    ]
  },
  {
    matches: ['Moeen ul Usool', 'معین الاصول', 'Al Usool', 'Mueen ul Usool'],
    candidates: [
      'https://besturdubooks.net/wp-content/uploads/2024/05/Mueen_ul_Usool.jpg',
    ]
  },
];

async function urlWorks(url) {
  try {
    const res = await axios.head(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function fix() {
  console.log('Starting comprehensive cover fix...\n');

  const { data: books } = await supabase.from('Books')
    .select('id, title, cover_url')
    .eq('category', CATEGORY);

  for (const book of books) {
    const t = book.title.toLowerCase();

    // Find which rule matches this book's title
    const rule = bookCovers.find(r =>
      r.matches.some(m => t.includes(m.toLowerCase()))
    );
    if (!rule) continue;

    // Find the first working cover URL
    let bestUrl = null;
    for (const candidate of rule.candidates) {
      const works = await urlWorks(candidate);
      if (works) {
        bestUrl = candidate;
        break;
      }
    }

    if (bestUrl) {
      await supabase.from('Books').update({ cover_url: bestUrl }).eq('id', book.id);
      console.log(`✅ ${book.title.substring(0, 55)}\n   → ${bestUrl.split('/').pop()}\n`);
    } else {
      console.log(`❌ NO WORKING URL for: ${book.title.substring(0, 55)}`);
    }
  }

  console.log('\nDone!');
}

fix();
