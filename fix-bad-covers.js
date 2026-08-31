import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://ymizqgtlnhvkqlidftiy.supabase.co',
    'sb_secret_iwPiKZopox0LHO_fSaLzFw_8puMPGJD'
);

async function fixBadCovers() {
    const badIds = JSON.parse(fs.readFileSync('bad_covers.json'));
    console.log(`Fixing ${badIds.length} bad covers...`);

    for (const id of badIds) {
        await supabase.from('Books').update({ cover_url: null }).eq('id', id);
        console.log(`✅ Nulled: ${id}`);
    }

    console.log('Done!');
}

fixBadCovers();