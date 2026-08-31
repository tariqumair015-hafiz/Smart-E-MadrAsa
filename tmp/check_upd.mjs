import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('Books')
    .select('title, cover_url')
    .in('title', [
       'خلاصۃ التجوید از قاری اظہار احمد تھانوی صاحب',
       'جوامع الکلم از مولانا مفتی محمد شفیع صاحب',
       'کتاب تعلیم الاسلام از مولانا مفتی محمد کفایت اللہ دہلوی صاحب'
    ])
    .eq('category', 'ثانویہ خاصہ سال اول');

  if (error) console.error(error);
  else console.log(data);
}

check();
