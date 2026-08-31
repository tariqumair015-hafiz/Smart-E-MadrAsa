import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function getDetailLinks(url) {
    if (!url) return [];
    try {
        console.log(`    Following detail: ${url}`);
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
        const $ = cheerio.load(res.data);
        const volumes = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && (href.includes('archive.org/download/') || href.includes('mediafire.com/') || href.includes('archive.org/details/'))) {
                let volTitle = text || `Volume ${volumes.length + 1}`;
                if (volTitle.toLowerCase().includes('download')) volTitle = `Volume ${volumes.length + 1}`;
                
                let downloadHref = href;
                if (href.includes('archive.org/details/')) {
                    downloadHref = href.replace('/details/', '/download/');
                }
                
                if (!volumes.find(v => v.url === downloadHref)) {
                    volumes.push({ title: volTitle, url: downloadHref });
                }
            }
        });
        return volumes;
    } catch (e) {
        return [];
    }
}

async function scrapeCategory(baseUrl, totalPages, categoryUrdu) {
    const allBooks = [];
    const processedDetailLinks = new Set();

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
        console.log(`Scraping ${categoryUrdu} page ${page}: ${url}`);
        
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(res.data);
            const content = $('.entry-content');
            const images = content.find('img');
            
            for (let i = 0; i < images.length; i++) {
                const img = $(images[i]);
                if (img.attr('src') && img.attr('src').includes('logo')) continue;

                // Cover Image - Use robust lazy-load attributes
                let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                if (!coverUrl || coverUrl.includes('placeholder')) continue;
                
                // Clean CDN prefixes
                if (coverUrl.includes('wp.com/')) {
                    const match = coverUrl.match(/i\d\.wp\.com\/(.*?)\?/);
                    if (match) coverUrl = 'https://' + match[1];
                }
                if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];

                // Search Title - strictly above the image
                let title = '';
                let search = img.parent();
                let limit = 0;
                while (search.length && limit < 10 && !title) {
                    const prev = search.prev();
                    const text = prev.text().trim();
                    if (text && text.length > 10 && !text.includes('Download') && !text.includes('Click here') && !text.includes('آن لائن')) {
                        title = text;
                    }
                    search = prev;
                    limit++;
                }
                
                if (!title) {
                    title = img.attr('alt') || img.parent().text().trim() || img.parent().prev().text().trim();
                }

                // Collect Volumes / Detail Link - following the image
                let volumes = [];
                let detailLink = '';
                let scan = img.parent();
                limit = 0;
                while (scan.length && limit < 15) {
                    const next = scan.next();
                    if (next.find('img').length > 0) break; // Hit next book
                    
                    const links = next.find('a');
                    links.each((j, el) => {
                        const href = $(el).attr('href');
                        const text = $(el).text().trim();
                        if (href && (href.includes('archive.org') || href.includes('mediafire.com'))) {
                            if (href.includes('/details/')) {
                                volumes.push({ title: text || `Vol ${volumes.length+1}`, url: href.replace('/details/', '/download/') });
                            } else {
                                volumes.push({ title: text || `Vol ${volumes.length+1}`, url: href });
                            }
                        } else if (href && (text.includes('ڈاؤنلوڈ کریں') || text.includes('آن لائن') || text.includes('Detail'))) {
                            detailLink = href;
                        }
                    });
                    
                    scan = next;
                    limit++;
                }

                if (volumes.length === 0 && detailLink && !processedDetailLinks.has(detailLink)) {
                    volumes = await getDetailLinks(detailLink);
                    processedDetailLinks.add(detailLink);
                }

                if (title && volumes.length > 0) {
                    title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim();
                    let subCategory = 'درسی کتب';
                    if (title.includes('شرح') || title.toLowerCase().includes('sharah') || title.toLowerCase().includes('shuruh')) {
                        subCategory = (title.includes('عربی') || title.toLowerCase().includes('arabic')) ? 'عربی شروحات' : 'اردو شروحات';
                    }

                    allBooks.push({
                        title: title,
                        cover_url: coverUrl,
                        volumes: volumes,
                        pdf_url: volumes[0].url,
                        category: categoryUrdu,
                        sub_category: subCategory
                    });
                    console.log(`  Found: ${title.substring(0, 40)}... (${volumes.length} vols)`);
                }
            }
        } catch (e) {
            console.error(`Error on ${url}: ${e.message}`);
        }
    }
    return allBooks;
}

async function run() {
    const sadesa = await scrapeCategory('https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/', 14, 'درجہ سادسہ');
    const sania = await scrapeCategory('https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/', 9, 'درجہ ثانیہ');
    
    fs.writeFileSync('perfect_scrape.json', JSON.stringify([...sadesa, ...sania], null, 2));
    console.log(`Done! Found ${sadesa.length} (6th yr) and ${sania.length} (2nd yr) books.`);
}

run();
