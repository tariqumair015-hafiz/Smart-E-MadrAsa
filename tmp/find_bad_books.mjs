import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const Keywords = ['بخاری', 'مسلم', 'ترمذی', 'مشکاۃ', 'ہدایہ', 'ابو داؤد', 'نسائی', 'ابن ماجہ', 'طحاوی', 'مؤطا', 'حدیث', 'Hadith', 'Bukhari', 'Muslim', 'Tirmidhi', 'Mishkat', 'Hidayah'];

async function check() {
    const { data } = await supabase.from('Books').select('id, title, category');
    const filtered = data.filter(b => b.category === 'درجہ ثانیہ' && Keywords.some(k => b.title.includes(k)));
    console.log(`Potential 8th year books in 2nd year: ${filtered.length}`);
    filtered.forEach(b => console.log(`ID: ${b.id} | Title: ${b.title}`));
}

check();
