import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSearchQuery(title) {
    const urduMatch = title.match(/[\u0600-\u06FF]+/g);
    if (urduMatch) return urduMatch.slice(0, 3).join(' ');
    return title.split(' ').slice(0, 2).join(' ');
}

async function accurateRepair() {
    const content = fs.readFileSync('full_cover_audit.txt', 'utf8');
    const lines = content.split('\n');
    const targetBooks = [];
    for (const line of lines) {
        const match = line.match(/^\d+\. \[ID: (\d+)\] (.*?) \((.*?)\)$/);
        if (match) targetBooks.push({ id: match[1], title: match[2].trim() });
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let successCount = 0;
    
    for (const book of targetBooks) {
        const query = getSearchQuery(book.title);
        console.log(`\n[${book.id}] Searching: "${query}"`);
        
        try {
            await page.goto(`https://besturdubooks.net/?s=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            const results = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.post-item, article, .item, .product-item')).map(item => {
                    const title = item.innerText.split('\n')[0].trim();
                    const img = item.querySelector('img')?.src;
                    return { title, img };
                }).filter(r => r.img && !r.img.includes('placeholder'));
            });

            let match = null;
            for (const res of results) {
                // Check overlap of words
                const bWords = book.title.split(/\s+/);
                const rWords = res.title.split(/\s+/);
                const intersection = bWords.filter(w => rWords.includes(w));
                
                console.log(`  Checking "${res.title.substring(0,30)}" -> Matches: ${intersection.length}`);
                
                if (intersection.length >= 2) {
                    match = res;
                    break;
                }
            }

            if (match) {
                console.log(`  ✅ UPDATING: ${match.img}`);
                await supabase.from('Books').update({ cover_url: match.img }).eq('id', book.id);
                successCount++;
            }
        } catch (e) { }
    }
    await browser.close();
    console.log(`Matched ${successCount}/${targetBooks.length}`);
}

accurateRepair();
