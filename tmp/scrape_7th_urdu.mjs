import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    const allBooks = [];
    const baseUrl = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/';
    const totalPages = 6; 

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        console.log(`Scraping page ${page}: ${url}`);
        
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
            const $ = cheerio.load(res.data);
            const content = $('.entry-content, .post-content').first();
            
            const images = content.find('img');
            images.each((i, el) => {
                const img = $(el);
                let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder')) return;
                
                if (coverUrl.includes('wp.com/')) {
                    const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
                    if (match) coverUrl = 'https://' + match[1];
                }
                if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];
                
                let title = img.attr('alt') || img.attr('title') || '';
                title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim();
                
                // Fallback for missing title
                if (!title) {
                    title = img.parent().prev().text().replace(/\n/g, ' ').trim() || `Book ${allBooks.length + 1}`;
                }

                let currentLinks = [];
                
                // Find top-level child of .entry-content containing the image
                let scan = img.closest('.entry-content > *');
                if (scan.length === 0) scan = img.parent();
                
                let limit = 0;
                
                // 1. Links inside the same container
                const processAnchor = (a) => {
                    let href = $(a).attr('href');
                    let ltext = $(a).text().trim();
                    if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                         if (href.includes('/details/')) href = href.replace('/details/', '/download/');
                         if (ltext.includes('Read') || ltext.includes('آن لائن')) return;
                         
                         // Fix empty text
                         if(!ltext) ltext = `جلد ${currentLinks.length + 1}`;
                         
                         let dup = currentLinks.find(c => c.url === href);
                         if (!dup) currentLinks.push({title: ltext, url: href});
                    }
                };
                
                scan.find('a').each((j, a) => processAnchor(a));
                
                // 2. Links in subsequent siblings
                while (scan.length && limit < 15) {
                    scan = scan.next();
                    if (!scan.length || scan.find('img').length > 0) break; // Reached next book
                    scan.find('a').each((j, a) => processAnchor(a));
                    limit++;
                }

                // Push
                if (currentLinks.length > 0) {
                    // Try to deduplicate mediafire/archive mirrors within same book
                    let finalLinks = [];
                    for(let l of currentLinks) {
                        let isMirror = false;
                        for(let k of finalLinks) {
                            if (l.url.includes('mediafire') && k.url.includes('archive.org')) {
                               let extractedNew = l.url.split('/').pop().replace('.pdf', '');
                               let extractedOld = k.url.split('/').pop().replace('.pdf', '');
                               if (extractedNew === extractedOld) isMirror = true;
                            }
                        }
                        if (!isMirror) finalLinks.push(l);
                    }
                    
                    allBooks.push({
                        title: title,
                        author: 'نامعلوم',
                        category: 'درجہ سابعہ',
                        sub_category: 'اردو شروحات',
                        cover_url: coverUrl,
                        pdf_url: finalLinks[0].url,
                        description: JSON.stringify(finalLinks),
                        pages: 0,
                        is_free: true,
                        downloads: 0,
                        rating: 0,
                        language: 'ur'
                    });
                    console.log(`  Added: ${title} (${finalLinks.length} vols)`);
                }
            });
            
        } catch (e) {
            console.error(`Error on ${url}: ${e.message}`);
        }
        await delay(3000); 
    }


    console.log(`\nTotal candidate books extracted: ${allBooks.length}`);
    let dbBooks = allBooks;

    if (dbBooks.length > 0) {
        console.log(`  Updating Supabase...`);
        // Remove duplicates internally before upsert
        const uniqueBooks = [...new Map(dbBooks.map(item => [item.pdf_url, item])).values()];
        const { error } = await supabase.from('Books').upsert(uniqueBooks, { onConflict: 'pdf_url' });
        if (error) console.error('  Save error:', error.message);
        else console.log(`  ✅ Successfully saved into Database!`);
    } else {
        console.log("No books found.");
    }
}

run();
