const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ymizqgtlnhvkqlidftiy.supabase.co', 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI');

async function test() {
  const { data } = await supabase.from('Books').select('title, category, sub_category').eq('pdf_url', 'https://archive.org/download/DarsENizamiDoraeHadees8thYear01/SAHIH_AL_BUKHARI_BUSHRA_01.pdf').maybeSingle();
  console.log('Book in DB:', data);
}
test();
