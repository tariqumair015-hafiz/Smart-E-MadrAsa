import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const commonCovers = [
    { title: 'کتاب بخاری شریف', search: 'صحیح البخاری' },
    { title: 'کتاب صحیح مسلم', search: 'صحیح مسلم' },
    { title: 'کتاب جامع الترمذی', search: 'جامع الترمذی' },
    { title: 'کتاب ابو داؤد', search: 'سنن ابی داؤد' },
    { title: 'شمائل ترمذی مع اردو', search: 'شمائل ترمذی' },
    { title: 'صحیح البخاری دیگر ایڈیشنز', search: 'صحیح البخاری' }
  ];

  for (const item of commonCovers) {
    const { data: source } = await supabase
      .from('Books')
      .select('cover_url')
      .ilike('title', `%${item.search}%`)
      .not('cover_url', 'ilike', '%placeholder%')
      .limit(1);

    if (source && source.length > 0) {
      console.log(`Found cover for ${item.title}: ${source[0].cover_url}`);
      await supabase
        .from('Books')
        .update({ cover_url: source[0].cover_url })
        .eq('category', 'عالمیہ بنات سال دوم')
        .eq('title', item.title);
      
      // Also update others that contain the same base title but have no cover
      await supabase
        .from('Books')
        .update({ cover_url: source[0].cover_url })
        .eq('category', 'عالمیہ بنات سال دوم')
        .ilike('title', `%${item.search}%`)
        .ilike('cover_url', '%placeholder%');
    }
  }
}

run();
