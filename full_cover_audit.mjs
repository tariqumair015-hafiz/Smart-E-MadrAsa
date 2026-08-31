import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fullAudit() {
    console.log("Fetching all books from database...");
    let allBooks = [];
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('Books')
            .select('id, title, cover_url, sub_category')
            .range(offset, offset + batchSize - 1);
        if (error || !data || data.length === 0) break;
        allBooks.push(...data);
        offset += batchSize;
        if (data.length < batchSize) break;
    }
    
    console.log(`Auditing ${allBooks.length} books...`);
    
    const results = {
        nullCovers: [],
        brokenLinks: [],
        placeholderImages: [], // Based on identical size
        healthy: []
    };
    
    const sizeMap = {};
    const concur = 100;
    
    for (let i = 0; i < allBooks.length; i += concur) {
        const slice = allBooks.slice(i, i + concur);
        const batchResults = await Promise.all(slice.map(async (book) => {
            if (!book.cover_url) {
                return { type: 'null', book };
            }
            
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(book.cover_url, { method: 'HEAD', signal: controller.signal });
                clearTimeout(tid);
                
                if (res.ok) {
                    const size = res.headers.get('content-length');
                    return { type: 'ok', size, book };
                } else {
                    return { type: 'broken', book };
                }
            } catch (e) {
                return { type: 'broken', book };
            }
        }));
        
        batchResults.forEach(res => {
            if (res.type === 'null') results.nullCovers.push(res.book);
            else if (res.type === 'broken') results.brokenLinks.push(res.book);
            else {
                if (res.size) {
                    if (!sizeMap[res.size]) sizeMap[res.size] = [];
                    sizeMap[res.size].push(res.book);
                }
                results.healthy.push(res.book);
            }
        });
        console.log(`Checked ${Math.min(i + concur, allBooks.length)}/${allBooks.length}`);
    }
    
    // Identify placeholders by repeating size (if > 10 books share a size, it's likely a generic cover)
    const threshold = 10;
    Object.entries(sizeMap).forEach(([size, books]) => {
        if (books.length >= threshold) {
            console.log(`Detected ${books.length} books sharing image size: ${size} bytes. Likely generic placeholder.`);
            results.placeholderImages.push(...books);
        }
    });

    // Generate Report
    const totalPlaceholders = results.nullCovers.length + results.brokenLinks.length + results.placeholderImages.length;
    let report = `--- HAFIZ MADARSA PRO COVER AUDIT REPORT ---\n`;
    report += `Total Books: ${allBooks.length}\n`;
    report += `Total Displaying Generic/Placeholder/Missing: ${totalPlaceholders}\n`;
    report += `Broken Links: ${results.brokenLinks.length}\n`;
    report += `Missing Links (NULL): ${results.nullCovers.length}\n`;
    report += `Generic colored covers detected (by size): ${results.placeholderImages.length}\n\n`;
    
    report += "--- LIST OF BOOKS NEEDING NEW COVERS ---\n";
    
    const combined = [...results.nullCovers, ...results.brokenLinks, ...results.placeholderImages];
    // Deduplicate if any
    const uniqueMap = {};
    combined.forEach(b => uniqueMap[b.id] = b);
    
    Object.values(uniqueMap).forEach((b, index) => {
        report += `${index + 1}. [ID: ${b.id}] ${b.title} (${b.sub_category || 'General'})\n`;
    });
    
    fs.writeFileSync('full_cover_audit.txt', report, 'utf8');
    console.log("Audit complete. Saved to full_cover_audit.txt");
}

fullAudit();
