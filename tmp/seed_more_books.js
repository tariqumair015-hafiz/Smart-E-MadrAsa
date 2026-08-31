import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co'
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI'

const supabase = createClient(supabaseUrl, supabaseKey)

const moreBooks = [
  // 1st Year (Dars-e-Nizami)
  {
    title: 'نحو میر',
    author: 'میر سید شریف جرجانیؒ',
    category: 'درجہ اولیٰ',
    sub_category: 'درسی کتب',
    pdf_url: 'https://archive.org/download/Nahw-e-Meer/Nahw-e-Meer.pdf',
    cover_url: '',
    pages: 120,
    is_free: true
  },
  {
    title: 'نحو میر کی اردو شرح',
    author: 'متعدد',
    category: 'درجہ اولیٰ',
    sub_category: 'اردو شروحات',
    pdf_url: 'https://archive.org/download/SharhNahw-e-meerUrdu/SharhNahw-e-meerUrdu.pdf',
    cover_url: '',
    pages: 250,
    is_free: true
  },
  // 4th Year
  {
    title: 'الہدایۃ (اول)',
    author: 'علامہ مرغینانیؒ',
    category: 'درجہ رابعہ',
    sub_category: 'درسی کتب',
    pdf_url: 'https://archive.org/download/Al-Hidayah-Arabic/Al-Hidayah-1.pdf',
    cover_url: '',
    pages: 400,
    is_free: true
  },
  // Quran Section
  {
    title: 'قرآن مجید (تجوید کے ساتھ)',
    author: 'اللہ تعالیٰ',
    category: 'قرآن مجید',
    sub_category: 'منتخب',
    pdf_url: 'https://archive.org/download/Quran-Tajweed/Quran-Tajweed.pdf',
    cover_url: '',
    pages: 611,
    is_free: true
  },
  // Ulama Books
  {
    title: 'خطباتِ رشیدیہ',
    author: 'مفتی رشید احمد لودھیانویؒ',
    category: 'علمائے کرام',
    sub_category: 'منتخب',
    pdf_url: 'https://archive.org/download/Khutbat-e-Rasheediyah/Khutbat-e-Rasheediyah.pdf',
    cover_url: '',
    pages: 450,
    is_free: true
  }
];

async function seed() {
  console.log('Seeding more books into Supabase...');
  for (const book of moreBooks) {
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
