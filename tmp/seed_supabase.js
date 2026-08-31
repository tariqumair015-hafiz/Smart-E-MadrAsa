import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'

const supabase = createClient(supabaseUrl, supabaseKey)

const featuredBooks = [
  {
    title: 'صحیح بخاری',
    author: 'امام بخاریؒ',
    category: 'حدیث',
    sub_category: 'منتخب',
    cover_url: '/covers/sahih_bukhari.png',
    pdf_url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%201.pdf',
    pages: 7000,
    is_free: true,
    rating: 5,
    downloads: 1250,
    volumes: JSON.stringify([
      { title: 'جلد 1', url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%201.pdf' },
      { title: 'جلد 2', url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%202.pdf' },
      { title: 'جلد 3', url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%203.pdf' }
    ])
  },
  {
    title: 'تفسیر ابن کثیر',
    author: 'علامہ ابن کثیرؒ',
    category: 'تفسیر القرآن',
    sub_category: 'منتخب',
    cover_url: '/covers/tafseer.png',
    pdf_url: 'https://archive.org/download/TafseerIbn-e-kaseer-UrduTranslationByMaulanaMuhammadJunagarhi/Volume1-Tafseer-ibn-e-kaseer_urdu.pdf',
    pages: 4500,
    is_free: true,
    rating: 5,
    downloads: 840
  },
  {
    title: 'سیرت النبی ﷺ',
    author: 'شبلی نعمانیؒ',
    category: 'سیرت و تاریخ',
    sub_category: 'منتخب',
    cover_url: '/covers/seerat.png',
    pdf_url: 'https://archive.org/download/Seerat-un-Nabi/Volume1.pdf',
    pages: 1200,
    is_free: true,
    rating: 5,
    downloads: 620
  },
  {
    title: 'ریاض الصالحین',
    author: 'امام نوویؒ',
    category: 'احادیث',
    sub_category: 'منتخب',
    cover_url: '/covers/riyad.png',
    pdf_url: 'https://archive.org/download/Riyad-us-Saliheen/Riyad-us-Saliheen.pdf',
    pages: 850,
    is_free: true,
    rating: 5,
    downloads: 950
  }
];

async function seed() {
  console.log('Seeding featured books into Supabase...');
  for (const book of featuredBooks) {
    const { data, error } = await supabase.from('Books').insert([book]).select();
    if (error) {
      console.error(`Error inserting ${book.title}:`, error.message);
    } else {
      console.log(`Successfully inserted: ${book.title}`);
    }
  }
  console.log('Seeding complete.');
}

seed();
