import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalize(title) {
  let t = title.toLowerCase();
  const noise = [/by\b.*/g, /mufti|maulana|taqi|usmani/g, /\b(ka|ki|ke|kay|o|wa|aur|e|the|a|an)\b/g];
  noise.forEach(r => t = t.replace(r, ' '));
  return t.replace(/[^\w\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function debugTaqi() {
  const { data } = await supabase.from('Books').select('id,title').ilike('sub_category', '%mufti-muhammad-taqi-usmani%');
  data.forEach(b => {
    console.log(`${b.id}|${b.title}|${normalize(b.title)}`);
  });
}
debugTaqi();
