import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, count, error } = await supabase
    .from('Books')
    .select('*', { count: 'exact', head: true });
    
  console.log('Total Books count in Supabase:', count);

  const { data: taqi, count: taqiCount } = await supabase
    .from('Books')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'Mufti Muhammad Taqi Usmani'); // Or check what the exact category name is. It might be different.
    
  console.log('Mufti Muhammad Taqi Usmani Books count:', taqiCount);
  
  // Just in case, let's group by category
  const { data: categories } = await supabase
    .from('Books')
    .select('category');
    
  if (categories) {
    const counts = {};
    categories.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    console.log('Categories:', counts);
  }
}

check();
