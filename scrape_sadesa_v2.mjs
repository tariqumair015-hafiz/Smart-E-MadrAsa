import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/';
const totalPages = 14;

async function getDetailLinks(url) {
    if (!url) return [];
    try {
        console.log(`  Fetching detail page: ${url}`);
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
        console.error(`  Error fetching detail page ${url}: ${e.message}`);
        return [];
    }
}

async function scrape() {
    const allBooks = [];

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        console.log(`Scraping page ${page}: ${url}`);
        
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(res.data);
            const content = $('.entry-content');

            // Find all books by images
            const images = content.find('img');
            
            for (let i = 0; i < images.length; i++) {
                const img = $(images[i]);
                
                // Robust cover URL
                let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src');
                if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder')) continue;
                
                if (coverUrl.includes('i2.wp.com')) {
                    const originalMatch = coverUrl.match(/i[0-9]\.wp\.com\/(.*?)\?/);
                    if (originalMatch && originalMatch[1]) coverUrl = 'https://' + originalMatch[1];
                }
                if (coverUrl.includes('?')) coverUrl = coverUrl.split('?')[0];

                // Title extraction
                let title = '';
                let prev = img.parent().prev();
                while (prev.length && !title) {
                    const text = prev.text().trim();
                    if (text && text.length > 5 && !text.includes('Click here') && !text.includes('Download')) {
                        title = text;
                    }
                    prev = prev.prev();
                }
                if (!title) {
                    title = img.parent().text().trim() || img.parent().next().text().trim();
                }

                // Check for direct links or detail link
                let volumes = [];
                let next = img.parent().next();
                let limit = 0;
                let detailLink = '';
                
                while (next.length && limit < 15) {
                    if (next.find('img').length > 0 && limit > 0) break;
                    
                    const links = next.find('a');
                    links.each((j, linkEl) => {
                        const href = $(linkEl).attr('href');
                        const text = $(linkEl).text().trim();
                        if (href && (href.includes('archive.org/download') || href.includes('mediafire.com'))) {
                            let volTitle = text || `Volume ${volumes.length + 1}`;
                            if (volTitle.toLowerCase().includes('download')) volTitle = `Volume ${volumes.length + 1}`;
                            volumes.push({ title: volTitle, url: href });
                        } else if (href && (text.includes('ڈاؤنلوڈ کریں') || text.includes('آن لائن پڑھیں') || text.includes('Detail'))) {
                            detailLink = href;
                        }
                    });
                    
                    next = next.next();
                    limit++;
                }

                if (volumes.length === 0 && detailLink) {
                    volumes = await getDetailLinks(detailLink);
                }

                if (title && volumes.length > 0) {
                    title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').replace(/\[.*?\]/g, '').trim();
                    
                    let subCategory = 'درسی کتب';
                    const lowerTitle = title.toLowerCase();
                    if (lowerTitle.includes('shuruh') || lowerTitle.includes('sharah') || lowerTitle.includes('sharh') || title.includes('شرح')) {
                        if (lowerTitle.includes('arabic') || lowerTitle.includes('عربی')) {
                            subCategory = 'عربی شروحات';
                        } else {
                            subCategory = 'اردو شروحات';
                        }
                    }

                    allBooks.push({
                        title: title,
                        cover_url: coverUrl,
                        volumes: volumes,
                        pdf_url: volumes[0].url,
                        sub_category: subCategory,
                        category: 'درجہ سادسہ'
                    });
                    console.log(`Added: ${title}`);
                }
            }

        } catch (err) {
            console.error(`Error on page ${page}:`, err.message);
        }
    }

    console.log(`Found ${allBooks.length} books in total.`);
    fs.writeFileSync('sadesa_books.json', JSON.stringify(allBooks, null, 2));
    console.log('Saved to sadesa_books.json');
}

scrape();
