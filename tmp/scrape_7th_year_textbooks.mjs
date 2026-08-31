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
            const content = $('.entry-content');
            const images = content.find('img');
            
            for (let i = 0; i < images.length; i++) {
                const img = $(images[i]);
                if (img.attr('src') && img.attr('src').includes('logo')) continue;

                let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                if (!coverUrl || coverUrl.includes('placeholder')) continue;
                
                if (coverUrl.includes('wp.com/')) {
                    const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
                    if (match) coverUrl = 'https://' + match[1];
                }
                if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];

                let title = '';
                let search = img.parent();
                let limit = 0;
                while (search.length && limit < 15 && !title) {
                    const text = search.text().trim();
                    if (text && text.length > 5 && !text.includes('Download') && !text.includes('Click here') && !text.includes('آن لائن')) {
                        title = text;
                    }
                    if (!title) {
                        const prev = search.prev();
                        if (prev.length) {
                             const prevText = prev.text().trim();
                             if (prevText && prevText.length > 5 && !prevText.includes('Download')) title = prevText;
                        }
                        search = prev;
                    }
                    limit++;
                }
                if (!title) title = img.attr('alt') || img.parent().text().trim();
                title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim().split('\n')[0].trim();

                let currentLinks = [];

                let scan = img.parent();
                limit = 0;
                // Scan practically until the next image
                while (scan.length && limit < 80) {
                    const next = scan.next();
                    if (!next.length || next.find('img').length > 0) break; // Next book
                    
                    const aTags = next.find('a');

                    aTags.each((j, el) => {
                        let href = $(el).attr('href');
                        let ltext = $(el).text().trim();
                        if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                            if (href.includes('/details/')) href = href.replace('/details/', '/download/');
                            
                            // Let's filter out "Read Online" because we only want downloads for the volume list
                            if (ltext.includes('Read') || ltext.includes('آن لائن')) return;
                            
                            // Try to deduplicate mirrors 
                            let isDuplicate = false;
                            for(let known of currentLinks) {
                                if (known.url === href) isDuplicate = true;
                                if (href.includes('mediafire') && known.url.includes('archive.org')) {
                                   let extractedNew = href.split('/').pop().replace('.pdf', '');
                                   let extractedOld = known.url.split('/').pop().replace('.pdf', '');
                                   if (extractedNew === extractedOld) isDuplicate = true;
                                }
                            }
                            
                            if (!isDuplicate) {
                                currentLinks.push({ title: ltext || `جلد ${currentLinks.length+1}`, url: href });
                            }
                        }
                    });

                    scan = next;
                    limit++;
                }

                // Some books might not have volumes listed next to them directly in the P tag, 
                // Wait, if currentLinks is 0, let's see if there is a direct link on the image wrapper
                if (currentLinks.length === 0) {
                     const directLink = img.parent().attr('href') || img.parent().parent().attr('href');
                     if (directLink && (directLink.includes('.pdf') || directLink.includes('archive.org') || directLink.includes('mediafire'))) {
                         currentLinks.push({ title: `جلد 1`, url: directLink });
                     } else {
                         // also search preceding or current wrapper for 'a' tags directly
                         img.closest('p, div').find('a').each((j, el) => {
                             let href = $(el).attr('href');
                             if (href && (href.includes('.pdf') || href.includes('archive.org'))) {
                                 if (href.includes('/details/')) href = href.replace('/details/', '/download/');
                                 currentLinks.push({ title: `جلد ${currentLinks.length+1}`, url: href });
                             }
                         });
                     }
                }

                if (currentLinks.length > 0) {
                   // Create final book
                   allBooks.push({
                        title: title,
                        author: 'نامعلوم',
                        category: 'درجہ سابعہ',
                        sub_category: 'درسی کتب',
                        cover_url: coverUrl,
                        pdf_url: currentLinks[0].url,
                        description: JSON.stringify(currentLinks),
                        pages: 0,
                        is_free: true,
                        downloads: 0,
                        rating: 0,
                        language: 'ur'
                   });
                   console.log(`  Added: ${title} (${currentLinks.length} vols)`);
                }
            }
        } catch (e) {
            console.error(`Error on ${url}: ${e.message}`);
        }
    }

    console.log(`\nTotal Textbooks extracted: ${allBooks.length}`);
    if (allBooks.length > 0) {
        console.log(`  Updating Supabase...`);
        // Remove duplicates internally before upsert
        const uniqueBooks = [...new Map(allBooks.map(item => [item.pdf_url, item])).values()];
        const { error } = await supabase.from('Books').upsert(uniqueBooks, { onConflict: 'pdf_url' });
        if (error) console.error('  Save error:', error.message);
        else console.log(`  ✅ Successfully saved into Database!`);
    } else {
        console.log("No books found. Please check selectors or page structure.");
    }
}

run();
