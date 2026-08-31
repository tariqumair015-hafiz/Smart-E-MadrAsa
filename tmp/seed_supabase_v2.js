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
    size_mb: '15',
    is_free: true,
    rating: 5,
    downloads: 1250,
    description: JSON.stringify([
      { title: 'جلد 1', url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%201.pdf' },
      { title: 'جلد 2', url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%202.pdf' },
      { title: 'جلد 3', url: 'https://archive.org/download/SahihBukhariUrdu/Sahih%20Bukhari%20Urdu%20-%20Volume%203.pdf' }
    ])
  }
];

async function seed() {
  console.log('Seeding Sahih Bukhari into Supabase...');
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
