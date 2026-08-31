import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deepCount() {
    // Total count
    const { count: totalCount, error: err1 } = await supabase
        .from('Books')
        .select('*', { count: 'exact', head: true });

    // Count strictly null
    const { count: nullCount, error: err2 } = await supabase
        .from('Books')
        .select('*', { count: 'exact', head: true })
        .is('cover_url', null);

    // Count strictly empty string
    const { count: emptyCount, error: err3 } = await supabase
        .from('Books')
        .select('*', { count: 'exact', head: true })
        .eq('cover_url', '');

    if (err1 || err2 || err3) {
        console.error('Error:', err1?.message || err2?.message || err3?.message);
        return;
    }

    console.log('--- Database Stats ---');
    console.log('Total Books:', totalCount);
    console.log('Books with NULL cover_url:', nullCount);
    console.log('Books with EMPTY cover_url:', emptyCount);
    console.log('Net valid covers:', totalCount - (nullCount || 0) - (emptyCount || 0));
}

deepCount();
