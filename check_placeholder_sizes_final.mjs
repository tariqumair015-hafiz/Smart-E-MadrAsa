import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPlaceholderSizes() {
    console.log('Fetching first 1000 books...');
    const { data, error } = await supabase
        .from('Books')
        .select('id, title, cover_url')
        .neq('cover_url', null)
        .limit(1000);
        
    if (error) { console.error(error); return; }
    
    const sizeMap = {};
    const concur = 100; // Strong concurrency
    
    for (let i = 0; i < data.length; i += concur) {
        const slice = data.slice(i, i + concur);
        await Promise.all(slice.map(async (b) => {
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 10000);
                const res = await fetch(b.cover_url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(tid);
                if (res.ok) {
                    const size = res.headers.get('content-length');
                    if (size) {
                        if (!sizeMap[size]) sizeMap[size] = { count: 0, examples: [] };
                        sizeMap[size].count++;
                        sizeMap[size].examples.push(b.title);
                    }
                }
            } catch (e) { }
        }));
        console.log(`Processed ${Math.min(i + concur, data.length)}/1000`);
    }
    
    let report = '--- SIZE ANALYSIS ---\n';
    const sorted = Object.entries(sizeMap)
        .filter(e => e[1].count > 5)
        .sort((a,b) => b[1].count - a[1].count);
        
    sorted.forEach(([size, d]) => {
        report += `${size} bytes: found ${d.count} times.\n`;
        report += `Examples: ${d.examples.slice(0,3).join(', ')}\n\n`;
    });
    
    fs.writeFileSync('size_report.txt', report);
    console.log('Report saved to size_report.txt');
}

checkPlaceholderSizes();
