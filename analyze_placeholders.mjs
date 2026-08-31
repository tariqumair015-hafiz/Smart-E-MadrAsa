import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPlaceholders() {
    let offset = 0;
    const batchSize = 1000;
    const allCovers = [];
    
    console.log('Fetching all cover_url values...');
    
    while (true) {
        const { data, error } = await supabase
            .from('Books')
            .select('cover_url')
            .range(offset, offset + batchSize - 1);
            
        if (error) {
            console.error('Supabase error:', error.message);
            break;
        }
        if (!data || data.length === 0) break;
        allCovers.push(...data.map(b => b.cover_url));
        offset += batchSize;
        if (data.length < batchSize) break;
    }
    
    const freq = {};
    allCovers.forEach(url => {
        if (!url) return;
        freq[url] = (freq[url] || 0) + 1;
    });
    
    const sorted = Object.entries(freq)
        .filter(([u, c]) => c > 1)
        .sort((a, b) => b[1] - a[1]);
        
    console.log('\nTop 20 Repeated Cover URLs (potential placeholders):');
    sorted.slice(0, 20).forEach(([url, count]) => {
        console.log(`${count} occurrences => ${url}`);
    });
}

checkPlaceholders();
