import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY = 'درجہ سادسہ';

// Specific targeted fixes: title-keyword -> correct cover
// Only patch books where we KNOW the cover is wrong
const patches = [
  // Siraji (original book) - طرازی cover was wrongly assigned
  {
    match: title => title.includes('Siraji fil Miras') || title.includes('السراجی فی المیراث'),
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/AlSirajiFilMeras.jpg',
    label: 'Al Siraji fil Miras (original)'
  },
  // Kitab ul Faraiz Asan Siraji - get its own cover from the site
  {
    match: title => title.includes('Kitab ul Faraiz') || title.includes('Asan Siraji'),
    cover: 'https://besturdubooks.net/wp-content/uploads/2017/09/KITAB_UL_FARAIZ_ASAN_SIRAJI.jpg',
    label: 'Kitab ul Faraiz Asan Siraji'
  },
  // Dars e Falkiyat (original textbook) - Fahm ul Falkiyat cover was wrongly given
  {
    match: title => title === 'Dars e Falkiyat درس فلکیات' || (title.includes('Dars') && title.includes('Falkiyat') && !title.includes('Talkhees') && !title.includes('Fahm')),
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Dars-e-Falkeyat.jpg',
    label: 'Dars e Falkiyat (textbook)'
  },
  // Talkhees ul Falkiyaat (commentary) - should have its own cover not Fahm
  {
    match: title => title.includes('Talkhees') && title.includes('Falkiyat'),
    cover: 'https://besturdubooks.net/wp-content/uploads/2018/10/Talkhees-ul-Falkiyaat.jpg',
    label: 'Talkhees ul Falkiyaat (commentary)'
  }
];

async function fix() {
  const { data: books } = await supabase.from('Books')
    .select('id, title')
    .eq('category', CATEGORY);

  for (const book of books) {
    for (const patch of patches) {
      if (patch.match(book.title)) {
        const { error } = await supabase.from('Books')
          .update({ cover_url: patch.cover })
          .eq('id', book.id);
        if (!error) {
          console.log(`✅ Fixed [${patch.label}]: ${book.title.substring(0, 60)}`);
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      }
    }
  }
  console.log('\nDone.');
}

fix();
