import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    const allBooks = [];
    const baseUrl = 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/';
    const totalPages = 2;

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
        console.log(`Scraping page ${page}: ${url}`);
        
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(res.data);
            const content = $('.entry-content, .post-content').first();
            
            let currentBook = null;
            
            // Loop through child elements in order
            content.children().each((i, el) => {
                const tagName = el.tagName.toLowerCase();
                const nodeText = $(el).text().trim();
                const hasImg = $(el).find('img').length > 0;
                
                // Detection of Title (H1-H4 or Strong wrapped in P)
                const isHeading = tagName.startsWith('h') && nodeText.length > 5;
                const isStrongP = tagName === 'p' && $(el).find('strong').text().trim() === nodeText && nodeText.length > 5 && !nodeText.includes('Download') && !nodeText.includes('Page');
                
                if (isHeading || isStrongP) {
                    // Save previous book if it has links
                    if (currentBook && currentBook.links.length > 0) {
                        allBooks.push(currentBook);
                    }
                    // Start new book
                    currentBook = {
                        title: nodeText.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim(),
                        cover_url: '',
                        links: []
                    };
                }
                
                // Image
                if (currentBook && hasImg) {
                    const img = $(el).find('img');
                    let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                    if (coverUrl && !coverUrl.includes('logo') && !coverUrl.includes('placeholder')) {
                        if (coverUrl.includes('wp.com/')) {
                            const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
                            if (match) coverUrl = 'https://' + match[1];
                        }
                        if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];
                        if (!currentBook.cover_url) currentBook.cover_url = coverUrl; // save first image
                    }
                }
                
                // Links
                if (currentBook) {
                    $(el).find('a').each((j, a) => {
                        let href = $(a).attr('href');
                        let ltext = $(a).text().trim();
                        if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                            if (href.includes('/details/')) href = href.replace('/details/', '/download/');
                            
                            // Let's filter out "Read Online" because we only want downloads for the volume list
                            if (ltext.includes('Read') || ltext.includes('آن لائن')) return;
                            
                            // Try to deduplicate mirrors 
                            let isDuplicate = false;
                            for(let known of currentBook.links) {
                                if (known.url === href) isDuplicate = true;
                                if (href.includes('mediafire') && known.url.includes('archive.org')) {
                                   let extractedNew = href.split('/').pop().replace('.pdf', '');
                                   let extractedOld = known.url.split('/').pop().replace('.pdf', '');
                                   if (extractedNew === extractedOld) isDuplicate = true;
                                }
                            }
                            
                            if (!isDuplicate) {
                                currentBook.links.push({ title: ltext || `جلد ${currentBook.links.length+1}`, url: href });
                            }
                        }
                    });
                }
            });
            
            // Push the last book
            if (currentBook && currentBook.links.length > 0) {
                allBooks.push(currentBook);
            }

        } catch (e) {
            console.error(`Error on ${url}: ${e.message}`);
        }
    }

    console.log(`\nTotal candidate books extracted: ${allBooks.length}`);
    let dbBooks = [];
    allBooks.forEach(b => {
       if(!b.cover_url) b.cover_url = 'https://via.placeholder.com/200x300?text=No+Cover';
       if(b.title && b.links.length > 0) {
           dbBooks.push({
                title: b.title,
                author: 'نامعلوم',
                category: 'درجہ سابعہ',
                sub_category: 'درسی کتب',
                cover_url: b.cover_url,
                pdf_url: b.links[0].url,
                description: JSON.stringify(b.links),
                pages: 0,
                is_free: true,
                downloads: 0,
                rating: 0,
                language: 'ur'
           });
           console.log(`  Added: ${b.title} (${b.links.length} vols)`);
       }
    });

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
