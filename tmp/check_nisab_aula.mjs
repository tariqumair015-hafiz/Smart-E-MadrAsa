import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const nisabSearch = [
  'نحو میر', 'Nahw Meer',
  'میزان و منشعب', 'Mizan',
  'ارشاد الصرف', 'Irshad us Sarf',
  'جمال القرآن', 'Jamal ul Quran',
  'صفوة المصادر', 'Safwatul Masadir',
  'تیسیر الابواب', 'Taisir ul Abwab',
  'نحو یسیر', 'An Nahw ul Yasir',
  'تسہیل النحو', 'Tasheel un Nahw',
  'الطریقہ العصریہ', 'Al Tariqat ul Asria',
  'جوامع الکلم', 'Jawami ul Kalim',
  'شرح مائۃ عامل', 'Sharh Miata Amil'
];

async function checkNisab() {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, category, sub_category')
    .eq('category', 'درجہ اولیٰ');

  if (error) { console.error(error); return; }

  const found = [];
  const missing = [];

  for (const term of nisabSearch) {
    const match = data.find(b => b.title.toLowerCase().includes(term.toLowerCase()));
    if (match) {
      found.push({ term, match });
    } else if (term.match(/[آ-ی ]+/)) { // only report missing urdu ones for clarity
      missing.push(term);
    }
  }

  console.log('Found:', found.length);
  console.log('Missing:', missing);
  
  // Log the first 10 books in Aula Darsi to see current order
  const darsi = data.filter(b => b.sub_category === 'درسی کتب');
  console.log('\nCurrent Darsi Order (Top 10):');
  darsi.slice(0, 10).forEach((b, i) => console.log(`${i+1}. ${b.title}`));
}

checkNisab();
