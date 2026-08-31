import { createClient } from '@supabase/supabase-js';

const sb = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');
const CAT = 'درجہ سادسہ';

// Exact per-book cover mapping from sadesa_final_books.json
// Each entry: { titleContains: string[], cover: url }
// titleContains must be UNIQUE enough to only match that ONE book
const exactCovers = [
  // Sharh ul Aqaid commentaries - each has its own unique cover
  { has: ['Nibras', 'النبراس'],       cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/al-nibras-arabic-sharh-sharh-ul-aqaid.jpg' },
  { has: ['Jawahir ul Bahiah', 'الجواھر البھیۃ'], cover: 'https://besturdubooks.net/wp-content/uploads/2013/09/AL-JAWAHIR-UL-BAHIYAH.jpg' },
  { has: ['Nukat wal Fawaid', 'النکت'], cover: 'https://besturdubooks.net/wp-content/uploads/2013/09/AL-NUKAT-WAL-FAWAID-SHARH-UL-AQAID-ARABIC.jpg' },
  { has: ['Faraid ul Bahiyah', 'الفرائد البھیۃ'], cover: 'https://besturdubooks.net/wp-content/uploads/2018/06/AL_FARAID_UL_BAHIYAH_UR_SHRH_SHARH_UL_AQAID.jpg' },
  { has: ['Bayan ul Fawaid', 'بیان الفوائد'],      cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/bayan-ul-fawaid-urdu-sharh-shah-ul-aqaid.jpg' },
  { has: ['Jawahir ul Faraid', 'جواہر الفرائد'],   cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/jawahir-ul-faraid-urdu-sharh-shah-ul-aqaid.jpg' },
  { has: ['Kashf ul Faraid', 'کشف الفرائد'],       cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/kashf-ul-faraid-urdu-sharh-shah-ul-aqaid.jpg' },
  { has: ['Ashraf ul Fawaid', 'اشرف الفوائد'],     cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/ashraf-ul-aqaid-urdu-sharh-shah-ul-aqaid-1.jpg' },
  { has: ['Taozeeh ul Aqaid', 'توضیح العقائد'],    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/taozeeh-ul-aqaid-urdu-sharh-shah-ul-aqaid.jpg' },
  { has: ['Nashr ul Fawaid', 'نشر الفوائد'],       cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/nashr-ul-fawaid-urdu-khulasa-shah-ul-aqaid.jpg' },

  // Aqeeda Tahawiah books
  { has: ['Matn ul Aqeeda', 'متن العقیدۃ الطحاویہ'], cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/matn-ul-aqeeda-al-tahawiah.jpg' },
  { has: ['Al Aqeeda Al Tahawiah Urdu', 'العقیدۃ الطحاویہ اردو'], cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/al-aqeeda-al-tahawiah-urdu.jpg' },
  { has: ['Sharh al Aqidah al Tahawiyya', 'شرح العقيدة الطحاوية'], cover: 'https://besturdubooks.net/wp-content/uploads/2023/03/SHARH_UL_AQIDAH_AL_TAHAWIYAH.jpg' },
  { has: ['Asidatul Samawiyah', 'العصیدۃ السماویۃ'], cover: 'https://besturdubooks.net/wp-content/uploads/2021/01/AL_ASIDATUL_SAMAWIYAH_URDU_SHARHA_AL_AQEEDA_AL_TAHAWIA.jpg' },
  { has: ['Wazahat ul Kamila', 'الوضاحت الکاملۃ'],  cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/al-wazahat-ul-kamila-urdu-sharh-al-aqeeda-al-tahawiah.jpg' },
  { has: ['Dars ul Havi', 'الدرس الحاوی'],          cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/al-dars-ul-havi-urdu-sharh-al-aqeeda-al-tahawi-1.jpg' },
  { has: ['Fawaid ud Darasia', 'الفوائد الدراسیہ'], cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/al-fawaid-ud-darasia-urdu-sharh-al-aqeeda-al-tahawiah-1.jpg' },

  // Fahm ul Falkiyaat - different from Talkhees
  { has: ['Fahmul Falkiyaat', 'Fahm ul Falkiyaat', 'فہم الفلکیات'], cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/fahm-ul-falkiyaat.jpg' },
  { has: ['Talkhees ul Falkiyaat', 'Talkhees', 'تلخیص الفلکیات'], cover: 'https://besturdubooks.net/wp-content/uploads/2022/08/TALKHEES-UL-FALKIYAAT.jpg' },
];

async function fix() {
  const { data: books } = await sb.from('Books').select('id, title').eq('category', CAT);
  let fixed = 0;

  for (const book of books) {
    const t = book.title;
    const rule = exactCovers.find(r => r.has.some(h => t.includes(h)));
    if (!rule) continue;

    const { error } = await sb.from('Books').update({ cover_url: rule.cover }).eq('id', book.id);
    if (!error) {
      console.log(`✅ ${t.substring(0, 60)}`);
      fixed++;
    }
  }
  console.log(`\nFixed: ${fixed} books`);
}

fix();
