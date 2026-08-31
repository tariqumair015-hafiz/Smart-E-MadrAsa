import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-salesa-3rd-year/';
const totalPages = 9;

async function scrape() {
    const allBooks = [];

    for (let page = 1; page <= totalPages; page++) {
        const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
        console.log(`Scraping page ${page}: ${url}`);
        
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(res.data);
            const content = $('.entry-content');

            // Find all books. In these landing pages, they usually have an image and a title.
            // Let's try to group them by images since each book entry usually has one cover.
            const images = content.find('img');
            
            images.each((i, imgEl) => {
                const img = $(imgEl);
                const coverUrl = img.attr('src');
                if (!coverUrl || coverUrl.includes('logo')) return;

                // Title is usually above or below the image. 
                // Let's look for sibling strong tags or paragraphs.
                let title = '';
                let prev = img.parent().prev();
                while (prev.length && !title) {
                    const text = prev.text().trim();
                    if (text && text.length > 5) {
                        title = text;
                    }
                    prev = prev.prev();
                }
                
                if (!title) {
                    // Try parent text or next sibling
                    title = img.parent().text().trim() || img.parent().next().text().trim();
                }

                // Volumes: Look for links in the following siblings
                const volumes = [];
                let next = img.parent().next();
                let limit = 0;
                while (next.length && limit < 15) {
                    // If we hit another image or a very long text, it might be the next book
                    if (next.find('img').length > 0 && limit > 0) break;
                    
                    const links = next.find('a');
                    links.each((j, linkEl) => {
                        const link = $(linkEl);
                        const href = link.attr('href');
                        const text = link.text().trim();
                        
                        // We want Archive.org links primarily
                        if (href && (href.includes('archive.org/download') || href.includes('mediafire.com'))) {
                            // Extract volume title/number if possible
                            let volTitle = text || `Volume ${volumes.length + 1}`;
                            if (volTitle.toLowerCase().includes('download')) volTitle = `Volume ${volumes.length + 1}`;
                            
                            // Only add if not already added (sometimes Link 1 and Link 2 point to same thing or we want to prefer Archive)
                            if (href.includes('archive.org')) {
                                volumes.push({ title: volTitle, url: href });
                            }
                        }
                    });
                    
                    next = next.next();
                    limit++;
                }

                if (title && volumes.length > 0) {
                    // Clean up title
                    title = title.replace(/Download Link \d+/g, '').replace(/Download/g, '').trim();
                    
                    // Categorize
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
                        pdf_url: volumes[0].url, // 1st volume for showcase
                        sub_category: subCategory,
                        category: 'درجہ ثالثہ'
                    });
                }
            });

        } catch (err) {
            console.error(`Error on page ${page}:`, err.message);
        }
    }

    console.log(`Found ${allBooks.length} books in total.`);
    fs.writeFileSync('salesa_books.json', JSON.stringify(allBooks, null, 2));
    console.log('Saved to salesa_books.json');
}

scrape();
