import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSearchQuery(title) {
    const urduMatch = title.match(/[\u0600-\u06FF]+/g);
    if (urduMatch) return urduMatch.slice(0, 3).join(' ');
    return title.split(/\s+/).slice(0, 2).join(' ');
}

function getSimilarity(bookTitle, searchResultTitle) {
    const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
    const bWords = normalize(bookTitle).split(' ').filter(w => w.length > 1);
    const rWords = normalize(searchResultTitle).split(' ').filter(w => w.length > 1);
    const matches = rWords.filter(w => bWords.includes(w));
    if (rWords.length === 0) return 0;
    return matches.length / rWords.length;
}

async function finalRepair() {
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
                const cols = Array.from(document.querySelectorAll('.wp-block-kadence-column'));
                return cols.map(col => {
                    const titleEl = col.querySelector('h1, h2, h3, .title, .entry-title, a');
                    const imgEl = col.querySelector('img');
                    return {
                        title: titleEl ? titleEl.innerText.trim() : '',
                        img: imgEl ? imgEl.src : null
                    };
                }).filter(r => r.img && !r.img.includes('placeholder') && r.title.length > 5);
            });

            if (results.length === 0) {
                console.log(`  X No results found on page.`);
                continue;
            }

            let bestMatch = null;
            for (const res of results) {
                const sim = getSimilarity(book.title, res.title);
                console.log(`  - Comparing with: "${res.title.substring(0, 30)}..." | Conf: ${(sim*100).toFixed(0)}%`);
                if (sim >= 0.5) { 
                    bestMatch = res;
                    break;
                }
            }

            if (bestMatch) {
                console.log(`  ✅ MATCH: ${bestMatch.img}`);
                const { error } = await supabase.from('Books').update({ cover_url: bestMatch.img }).eq('id', book.id);
                if (!error) successCount++;
            } else {
                console.log(`  X No confidence match.`);
            }
        } catch (e) {
            console.error(`  X Error: ${e.message}`);
        }
    }

    await browser.close();
    console.log(`\n--- REPAIR COMPLETE ---`);
    console.log(`Successfully recovered ${successCount} covers.`);
}

finalRepair();
