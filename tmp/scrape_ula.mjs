import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeUla() {
  try {
    const url = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
    console.log(`Scraping ${url}`);
    
    // Some sites block axios/node user agents, so we use a standard browser one
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });

    const html = response.data;
    console.log("HTML length:", html.length);
    const $ = cheerio.load(html);
    
    const books = [];
    
    // Try finding all wp-block-image or standard links
    $('.wp-block-image, .elementor-image, .ast-builder-layout-element').each((i, el) => {
      const title = $(el).find('a').attr('title') || $(el).find('img').attr('alt') || $(el).next().text().trim();
      const link = $(el).find('a').attr('href');
      if (link && link.includes('besturdubooks')) {
        books.push({ title: title || 'Book', link });
      }
    });

    if (books.length === 0) {
      // Fallback
      $('a').each((i, el) => {
        const title = $(el).text().trim() || $(el).find('img').attr('alt');
        const link = $(el).attr('href');
        // Heuristic: link has at least 3 slashes and is internal
        if (link && link.includes('besturdubooks.net') && title && title.length > 5 && link.split('/').length > 4) {
          if (!books.find(b => b.link === link)) {
            books.push({ title, link });
          }
        }
      });
    }

    console.log(`Found ${books.length} potential books on the first page.`);
    for(let j=0; j<Math.min(5, books.length); j++) {
      console.log(`Title: ${books[j].title}, Link: ${books[j].link}`);
    }

  } catch (error) {
    console.error("Scraping error:", error.message);
  }
}

scrapeUla();
