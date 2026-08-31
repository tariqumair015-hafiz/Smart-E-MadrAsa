import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getPdfLinks(detailUrl) {
    try {
        const res = await axios.get(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
        const $ = cheerio.load(res.data);
        const links = [];
        
        // Find all <a> tags that contain the PDF or specific site links
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const ltext = $(el).text().trim();
            if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                if (href.includes('/details/')) return; // Details page link inside details... skip
                if (ltext.includes('Read Online') || ltext.includes('آن لائن')) return;
                
                let title = ltext || `Download Link ${links.length + 1}`;
                if (title.toUpperCase() === 'LINK 1') title = 'Archive.org';
                if (title.toUpperCase() === 'LINK 2') title = 'Mediafire';
                
                let finalHref = href;
                if (finalHref.includes('/details/')) finalHref = finalHref.replace('/details/', '/download/');
                
                // Add if not already there
                if (!links.find(l => l.url === finalHref)) {
                   links.push({ title, url: finalHref });
                }
            }
        });
        return links;
    } catch (e) {
        console.error(`Error fetching detail ${detailUrl}: ${e.message}`);
        return [];
    }
}

async function runAulaScraper() {
    const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
    const totalPages = 11;
    const allBooks = [];

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        console.log(`Scraping Listing Page ${page}: ${url}`);

        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
            const $ = cheerio.load(res.data);
            
            // On category pages, books are often in article/div blocks
            // The browser subagent says books are in a grid.
            // Let's look for blocks containing an image and a "Read Online / Download" link.
            
            const bookBlocks = [];
            $('.entry-content p, .post-content p, .entry-content div, .post-content div').each((i, el) => {
                const block = $(el);
                const img = block.find('img').first();
                const link = block.find('a').filter((j, a) => $(a).text().includes('Download') || $(a).text().includes('ڈاؤنلوڈ')).first();
                
                if (img.length && link.length) {
                    let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('src');
                    if (coverUrl && !coverUrl.includes('logo')) {
                        if (coverUrl.includes('wp.com/')) {
                            const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
                            if (match) coverUrl = 'https://' + match[1];
                        }
                        if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];
                        
                        let detailUrl = link.attr('href');
                        let title = img.attr('alt') || img.attr('title') || block.text().split('آن لائن')[0].trim();
                        title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim();

                        if (!bookBlocks.find(b => b.detailUrl === detailUrl)) {
                            bookBlocks.push({ title, coverUrl, detailUrl });
                        }
                    }
                }
            });

            console.log(`Found ${bookBlocks.length} books on page ${page}. Fetching details...`);
            
            for (let b of bookBlocks) {
                console.log(`- Fetching links for: ${b.title}`);
                const links = await getPdfLinks(b.detailUrl);
                if (links.length > 0) {
                    allBooks.push({
                        title: b.title,
                        author: 'نامعلوم',
                        category: 'درجہ اولیٰ',
                        sub_category: 'درسی کتب',
                        cover_url: b.coverUrl,
                        pdf_url: links[0].url,
                        description: JSON.stringify(links),
                        pages: 0,
                        is_free: true,
                        language: 'ur'
                    });
                }
                await delay(2000); // 2 seconds between books
            }

        } catch (err) {
            console.error(`Error on Page ${page}: ${err.message}`);
        }
        await delay(5000); // 5 seconds between listing pages
    }

    console.log(`Total unique books prepared: ${allBooks.length}`);
    if (allBooks.length > 0) {
        console.log(`Upserting to Supabase...`);
        // Upsert by pdf_url to avoid duplicates if re-run
        const { error } = await supabase.from('Books').upsert(allBooks, { onConflict: 'pdf_url' });
        if (error) console.error('Supabase Error:', error.message);
        else console.log('Successfully updated Al-Aula textbooks!');
    }
}

runAulaScraper();
