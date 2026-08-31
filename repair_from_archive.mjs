import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSimilarity(s1, s2) {
    const normalize = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
    const w1 = normalize(s1).split(' ').filter(w => w.length > 1);
    const w2 = normalize(s2).split(' ').filter(w => w.length > 1);
    if (w1.length === 0 || w2.length === 0) return 0;
    const matches = w2.filter(w => w1.includes(w));
    return matches.length / Math.min(w1.length, w2.length);
}

async function repair() {
    console.log("Starting Archive.org Repair...");
    const list = fs.readFileSync('null_covers_list.txt', 'utf8').split('\n').filter(l => l.trim());
    const books = list.map(line => {
        const m = line.match(/^\[(\d+)\] (.*?) \((.*?)\)$/);
        return m ? { id: m[1], title: m[2], category: m[3] } : null;
    }).filter(b => b);

    console.log(`Processing ${books.length} books...`);

    let recovered = 0;

    for (const book of books) {
        // Search query construction: First 3-4 words of title
        const cleanTitle = book.title.replace(/By|از/gi, '').split(/\s+/).slice(0, 4).join(' ').trim();
        console.log(`\n[${book.id}] Searching for: "${cleanTitle}"`);

        try {
            const url = `https://archive.org/advancedsearch.php?q=title:("${encodeURIComponent(cleanTitle)}") AND mediatype:texts&fl[]=identifier,title&output=json&rows=5`;
            const resp = await axios.get(url, { timeout: 10000 });
            const docs = resp.data.response.docs;

            if (docs && docs.length > 0) {
                let bestDoc = null;
                for (const doc of docs) {
                    const sim = getSimilarity(book.title, doc.title);
                    console.log(`  - Found: "${doc.title.substring(0,40)}..." | Match: ${(sim*100).toFixed(0)}%`);
                    if (sim >= 0.6) { // 60% overlap
                        bestDoc = doc;
                        break; // Pick the first high-confidence match
                    }
                }

                if (bestDoc) {
                    const imgUrl = `https://archive.org/services/img/${bestDoc.identifier}`;
                    console.log(`  ✅ MATCH FOUND! ID: ${bestDoc.identifier}`);
                    
                    const { error } = await supabase.from('Books').update({ cover_url: imgUrl }).eq('id', book.id);
                    if (!error) recovered++;
                } else {
                    console.log(`  ❌ No confident match in search results.`);
                }
            } else {
                console.log(`  ❌ No results on Archive.org.`);
            }
        } catch (e) {
            console.error(`  ❌ Archive lookup error: ${e.message}`);
        }
        
        // Wait a bit to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\nArchive Repair Finished! Recovered: ${recovered}/${books.length}`);
}

repair();
