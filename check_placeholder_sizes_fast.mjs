import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPlaceholderSizes() {
    console.log('Fetching first 500 books...');
    const { data, error } = await supabase
        .from('Books')
        .select('id, title, cover_url')
        .neq('cover_url', null)
        .limit(500);
        
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(`Checking ${data.length} images...`);
    const sizeMap = {};
    const concur = 25; 
    
    for (let i = 0; i < data.length; i += concur) {
        const slice = data.slice(i, i + concur);
        await Promise.all(slice.map(async (b) => {
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(b.cover_url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(tid);
                if (res.ok) {
                    const size = res.headers.get('content-length');
                    if (size) {
                        if (!sizeMap[size]) sizeMap[size] = { count: 0, examples: [] };
                        sizeMap[size].count++;
                        if (sizeMap[size].examples.length < 2) sizeMap[size].examples.push(b.title);
                    }
                }
            } catch (e) { }
        }));
        if (i % 100 === 0) console.log(`Processed ${i}/${data.length}`);
    }
    
    console.log('\n--- SIZE ANALYSIS ---');
    const sorted = Object.entries(sizeMap)
        .filter(e => e[1].count > 5) // At least 5 books have this file size
        .sort((a,b) => b[1].count - a[1].count);
        
    sorted.forEach(([size, d]) => {
        console.log(`${size} bytes: found ${d.count} times. (Placeholder candidate?)`);
        console.log(`Examples: ${d.examples.join(', ')}`);
    });
}

checkPlaceholderSizes();
