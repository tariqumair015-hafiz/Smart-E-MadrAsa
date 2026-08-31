import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchBookDetail(url) {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    
    const title = $('h1.entry-title').text().trim() || $('h1, h2').first().text().trim();
    const cover_url = $('.entry-content img, .wp-block-image img, figure img').first().attr('src');
    
    let pdf_url = null;
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('archive.org') || href.endsWith('.pdf'))) {
        if (!pdf_url) pdf_url = href;
        // Prioritize archive.org
        if (href.includes('archive.org') && !href.includes('details')) {
           // We prefer direct download links if possible
           pdf_url = href;
        }
      }
    });

    console.log({
      title,
      cover_url,
      pdf_url
    });
  } catch (err) {
    console.error(err.message);
  }
}

fetchBookDetail('https://besturdubooks.net/islahi-nisab-recommended-course/');
