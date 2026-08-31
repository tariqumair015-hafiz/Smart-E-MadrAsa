import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSearchQuery(title) {
    const urduMatch = title.match(/[\u0600-\u06FF]+/g);
    if (urduMatch) return urduMatch.join(' ').split(' ').slice(0, 3).join(' ');
    return title.split(/By|از/i)[0].trim().split(' ').slice(0, 2).join(' ');
}

function getSimilarity(title1, title2) {
    const words1 = title1.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(w => w.length > 2);
    const words2 = title2.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(w => w.length > 2);
    if (words1.length === 0) return 0;
    const matches = words1.filter(w => words2.includes(w));
    return matches.length / words1.length;
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
        console.log(`\n[${book.id}] Searching for: "${query}"`);
        
        try {
            await page.goto(`https://besturdubooks.net/?s=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            const results = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.post-item, .product-item, .item, article'));
                return items.map(item => {
                    const titleEl = item.querySelector('h2, h3, .title, .entry-title');
                    const imgEl = item.querySelector('img');
                    return {
                        title: titleEl ? titleEl.innerText.trim() : '',
                        img: imgEl ? imgEl.src : null
                    };
                }).filter(r => r.img && !r.img.includes('placeholder'));
            });

            let bestMatch = null;
            for (const res of results) {
                const sim = getSimilarity(book.title, res.title);
                console.log(`  Similarity with "${res.title.substring(0,30)}...": ${(sim*100).toFixed(0)}%`);
                if (sim >= 0.5) { // 50% match
                    bestMatch = res;
                    break;
                }
            }

            if (bestMatch) {
                console.log(`  MATCH FOUND: ${bestMatch.img}`);
                await supabase.from('Books').update({ cover_url: bestMatch.img }).eq('id', book.id);
                successCount++;
            } else {
                console.log(`  X No high-confidence match found.`);
            }
        } catch (e) {
            console.error(`  X Error: ${e.message}`);
        }
    }

    await browser.close();
    console.log(`\nRepair complete. Successfully matched ${successCount}/${targetBooks.length} books.`);
}

accurateRepair();
