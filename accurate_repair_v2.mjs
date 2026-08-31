import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSearchQuery(title) {
    const urduMatch = title.match(/[\u0600-\u06FF]+/g);
    if (urduMatch) return urduMatch.join(' ').split(' ').slice(0, 3).join(' ');
    // English fallback
    return title.split(/By|از/i)[0].trim().split(' ').slice(0, 2).join(' ');
}

function getSimilarity(bookTitle, searchResultTitle) {
    const bookWords = bookTitle.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(w => w.length > 2);
    const searchWords = searchResultTitle.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(w => w.length > 2);
    
    if (searchWords.length === 0) return 0;
    
    const matches = searchWords.filter(w => bookWords.includes(w));
    // If we match 60% of the words IN THE SEARCH RESULT TITLE, it's a high confidence match
    return matches.length / searchWords.length;
}

async function accurateRepair() {
    const content = fs.readFileSync('full_cover_audit.txt', 'utf8');
    const lines = content.split('\n');
    const targetBooks = [];
    for (const line of lines) {
        const match = line.match(/^\d+\. \[ID: (\d+)\] (.*?) \((.*?)\)$/);
        if (match) targetBooks.push({ id: match[1], title: match[2].trim() });
    }

    console.log(`Auditing and repairing ${targetBooks.length} books...`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let successCount = 0;
    
    for (const book of targetBooks) {
        const query = getSearchQuery(book.title);
        console.log(`\n[${book.id}] Searching for: "${query}"`);
        
        try {
            await page.goto(`https://besturdubooks.net/?s=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            const results = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.post-item, .product-item, .item, article, .entry-header'));
                return items.map(item => {
                    const titleEl = item.querySelector('h1, h2, h3, .title, .entry-title');
                    // Find image in the item or next to it
                    const imgEl = item.querySelector('img') || item.closest('article')?.querySelector('img');
                    return {
                        title: titleEl ? titleEl.innerText.trim() : '',
                        img: imgEl ? imgEl.src : null
                    };
                }).filter(r => r.img && !r.img.includes('placeholder'));
            });

            let bestMatch = null;
            for (const res of results) {
                const sim = getSimilarity(book.title, res.title);
                console.log(`  Confidence with "${res.title.substring(0,30)}": ${(sim*100).toFixed(0)}%`);
                if (sim >= 0.6) { // 60% of search title words found in our title
                    bestMatch = res;
                    break;
                }
            }

            if (bestMatch) {
                console.log(`  ✅ MATCH: ${bestMatch.img}`);
                await supabase.from('Books').update({ cover_url: bestMatch.img }).eq('id', book.id);
                successCount++;
            } else {
                console.log(`  ❌ No high-confidence match.`);
            }
        } catch (e) {
            console.error(`  ❌ Error: ${e.message}`);
        }
    }

    await browser.close();
    console.log(`\nRepair complete. Matched ${successCount}/${targetBooks.length} books.`);
}

accurateRepair();
