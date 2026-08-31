import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const mapping = [
    { from: 'maulana-khalid-saifullah-rahmani', to: 'maulana-khalid-saifullah' },
    { from: 'maulana-manazir-ahsan-gilani', to: 'maulana-manazir-gilani' },
    { from: 'maulana-ilyas-abdullah-gadhvi', to: 'maulana-ilyas-gadhvi' }
  ];

  for (const m of mapping) {
    console.log(`Updating ${m.from} to ${m.to}...`);
    const { data, error } = await supabase
      .from('Books')
      .update({ sub_category: m.to })
      .eq('sub_category', m.from);
    
    if (error) {
      console.error(`Error updating ${m.from}:`, error.message);
    } else {
      console.log(`Success! Updated records for ${m.to}`);
    }
  }
}

fix();
