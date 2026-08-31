import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkImageSizes() {
    console.log('Fetching books...');
    const { data, error } = await supabase
        .from('Books')
        .select('id, title, cover_url')
        .neq('cover_url', null)
        .limit(300); // Check a sample of 300
        
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(`Checking ${data.length} images for size...`);
    const sizeMap = {};
    const sampleSize = 100;
    const batch = data.slice(0, sampleSize);
    
    for (const b of batch) {
        try {
            const res = await fetch(b.cover_url, { method: 'HEAD' });
            if (res.ok) {
                const size = res.headers.get('content-length');
                if (size) {
                    if (!sizeMap[size]) sizeMap[size] = { count: 0, examples: [] };
                    sizeMap[size].count++;
                    if (sizeMap[size].examples.length < 3) sizeMap[size].examples.push(b.title);
                }
            }
        } catch (e) {
            // skip
        }
    }
    
    console.log('\n--- Image Size Analysis (Possible Placeholder Detection) ---');
    Object.entries(sizeMap)
        .filter(([s, data]) => data.count > 1)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([size, data]) => {
            console.log(`${data.count} images have size ${size} bytes.`);
            console.log(`Examples: ${data.examples.join(', ')}`);
        });
}

checkImageSizes();
