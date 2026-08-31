import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const scholars = [
  "maulana-sarfaraz-safdar",
  "maulana-tariq-jameel",
  "maulana-zahid-ur-rashdi",
  "maulana-zakariyya-kandhelvi",
  "maulana-zulfiqar-naqshbandi",
  "mufti-abu-lubaba",
  "mufti-akhtar-imam-adil",
  "mufti-inam-ul-haq",
  "mufti-muhammad-shafi",
  "mufti-muhammad-taqi-usmani",
  "mufti-jafar-milly",
  "mufti-rasheed-ludhianvi",
  "mufti-shoaibullah-miftahi",
  "muhammad-ishaq-multani"
];

async function check() {
  console.log("Checking books for scholars after Saeed Ahmad Palanpuri...");
  
  for (const s of scholars) {
    const { data: books, count, error } = await supabase
      .from('Books')
      .select('*', { count: 'exact' })
      .eq('sub_category', s);
      
    if (error) {
      console.error(`Error for ${s}:`, error.message);
      continue;
    }

    let volCount = 0;
    if (books) {
      books.forEach(b => {
        try {
          const v = JSON.parse(b.description || '[]');
          if (Array.isArray(v) && v.length > 1) volCount++;
        } catch(e) {}
      });
    }

    console.log(`Scholar: ${s} | Total Books: ${count} | Multi-Volume Books: ${volCount}`);
  }
}

check();
