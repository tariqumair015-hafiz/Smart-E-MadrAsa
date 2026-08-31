import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data } = await supabase.from('Books').select('title, cover_url').eq('category', 'درجہ سادسہ').limit(5);
    console.log(JSON.stringify(data, null, 2));
}

check();
