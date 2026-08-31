import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getFullBookData(detailUrl) {
    try {
        const res = await axios.get(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
        const $ = cheerio.load(res.data);
        
        let title = $('h1.entry-title').text().trim();
        let coverUrl = $('img.wp-post-image').attr('data-lazy-src') || $('img.wp-post-image').attr('data-src') || $('img.wp-post-image').attr('src');
        
        if (coverUrl && coverUrl.includes('wp.com/')) {
            const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
            if (match) coverUrl = 'https://' + match[1];
        }
        if (coverUrl && coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];

        const links = [];
        $('.entry-content a').each((i, el) => {
            const href = $(el).attr('href');
            let ltext = $(el).text().trim();
            if (href && (href.toLowerCase().includes('.pdf') || href.includes('archive.org') || href.includes('mediafire.com'))) {
                if (href.includes('/details/')) return;
                if (ltext.includes('Read') || ltext.includes('آن لائن')) return;
                
                let finalHref = href.includes('/details/') ? href.replace('/details/', '/download/') : href;
                if (!links.find(l => l.url === finalHref)) {
                   links.push({ title: ltext || `Download Link ${links.length + 1}`, url: finalHref });
                }
            }
        });

        return { title, coverUrl, links };
    } catch (e) {
        console.error(`Error fetching detail ${detailUrl}: ${e.message}`);
        return null;
    }
}

async function runAulaScraperDeep() {
    const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
    const totalPages = 11;
    const finalBooks = [];

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        console.log(`Scraping Listing Page ${page}: ${url}`);

        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 });
            const $ = cheerio.load(res.data);
            
            const detailUrls = [];
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                const text = $(el).text();
                if (href && (text.includes('Read Online') || text.includes('آن لائن')) && !detailUrls.includes(href)) {
                    detailUrls.push(href);
                }
            });

            console.log(`Found ${detailUrls.length} books on listing page ${page}. Processing details...`);
            for (let dUrl of detailUrls) {
                console.log(`  - Fetching: ${dUrl}`);
                const bookData = await getFullBookData(dUrl);
                if (bookData && bookData.links.length > 0) {
                    finalBooks.push({
                        title: bookData.title || 'Untitled',
                        author: 'نامعلوم',
                        category: 'درجہ اولیٰ',
                        sub_category: 'درسی کتب',
                        cover_url: bookData.coverUrl || '',
                        pdf_url: bookData.links[0].url,
                        description: JSON.stringify(bookData.links),
                        pages: 0,
                        is_free: true,
                        language: 'ur'
                    });
                }
                await delay(1500); 
            }

        } catch (err) {
            console.error(`Error on Page ${page}: ${err.message}`);
        }
        await delay(3000);
    }

    console.log(`Total books prepared: ${finalBooks.length}`);
    if (finalBooks.length > 0) {
        // Upsert in batches to avoid large request payload
        const batchSize = 10;
        for (let i = 0; i < finalBooks.length; i += batchSize) {
            const batch = finalBooks.slice(i, i + batchSize);
            const { error } = await supabase.from('Books').upsert(batch, { onConflict: 'pdf_url' });
            if (error) console.error('Supabase Error in batch:', error.message);
            else console.log(`Batch ${Math.floor(i/batchSize) + 1} uploaded.`);
        }
        console.log('Successfully completed Al-Aula textbook update!');
    }
}

runAulaScraperDeep();
