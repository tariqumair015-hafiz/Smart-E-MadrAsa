import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function getWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 40000 });
            return res.data;
        } catch (e) {
            console.error(`Attempt ${i+1} failed for ${url}: ${e.message}`);
            if (i === retries - 1) return null;
            await delay(5000);
        }
    }
}

async function getFullBookData(detailUrl) {
    const html = await getWithRetry(detailUrl);
    if (!html) return null;
    const $ = cheerio.load(html);
    
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
}

async function runAulaScraperDeep() {
    const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
    const totalPages = 11;
    let totalAdded = 0;

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        console.log(`\n--- Scraping Listing Page ${page}: ${url} ---`);

        const listingHtml = await getWithRetry(url);
        if (!listingHtml) {
            console.error(`Skipping Page ${page} due to error.`);
            continue;
        }

        const $ = cheerio.load(listingHtml);
        const detailUrls = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text();
            if (href && (text.includes('Read Online') || text.includes('آن لائن')) && !detailUrls.includes(href)) {
                detailUrls.push(href);
            }
        });

        console.log(`Found ${detailUrls.length} books on listing page ${page}. Processing details...`);
        const pageBooks = [];

        for (let dUrl of detailUrls) {
            console.log(`  - Fetching: ${dUrl}`);
            const bookData = await getFullBookData(dUrl);
            if (bookData && bookData.links.length > 0) {
                pageBooks.push({
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
            await delay(3000); // 3 seconds between books to avoid BAN
        }

        if (pageBooks.length > 0) {
            console.log(`Upserting ${pageBooks.length} books from page ${page}...`);
            const { error } = await supabase.from('Books').upsert(pageBooks, { onConflict: 'pdf_url' });
            if (error) console.error('Supabase Error:', error.message);
            else {
                console.log(`Page ${page} successfully uploaded.`);
                totalAdded += pageBooks.length;
            }
        }
        await delay(10000); // 10 seconds between pages
    }

    console.log(`\nDONE! Total unique book entries processed: ${totalAdded}`);
}

runAulaScraperDeep();
