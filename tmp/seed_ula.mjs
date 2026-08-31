import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
// Need the service key or anon key that has insert permissions.
// The public anon key is sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getDirectArchiveLink(url) {
  if (!url) return '';
  url = url.trim();
  // convert details -> download
  if (url.includes('/details/')) {
    const parts = url.split('/details/');
    const id = parts[1].split('/')[0].split('?')[0];
    return `https://archive.org/download/${id}/${id}.pdf`;
  }
  return url;
}

function determineSubCategory(title) {
  if (!title) return 'درسی کتب';
  const t = title.replace(/\s+/g, '');
  if (t.includes('شرح') || t.includes('شروحات') || t.includes('حل') || t.includes('اردو')) {
    if (t.includes('عربی')) return 'عربی شروحات';
    return 'اردو شروحات';
  }
  if (t.includes('عربی')) return 'عربی شروحات';
  
  return 'درسی کتب';
}

async function scrapePage(pageUrl) {
  try {
    const res = await axios.get(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const $ = cheerio.load(res.data);
    const books = [];
    
    $('.ast-grid-common-col .ast-blog-featured-section a, article .entry-title a, .type-post h2 a').each((i, el) => {
      const title = $(el).attr('title') || $(el).text().trim();
      const link = $(el).attr('href');
      
      if (link && link.includes('besturdubooks.net') && link.split('/').length > 4) {
        if (!link.includes('/category/') && !link.includes('/author/')) {
          books.push({ title: title || 'Book', link });
        }
      }
    });

    // filter duplicates by link
    const unique = [];
    const seen = new Set();
    for (const b of books) {
      if (!seen.has(b.link)) {
        seen.add(b.link);
        unique.push(b);
      }
    }
    return unique;
  } catch (err) {
    console.error(`Error scraping ${pageUrl}:`, err.message);
    return [];
  }
}

async function scrapeBookDetail(url) {
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    const $ = cheerio.load(res.data);
    
    let title = $('h1.entry-title').text().trim() || $('h1').first().text().trim();
    if (!title) return null;
    
    // Clean title, remove "PDF" and "Download" etc
    title = title.replace(/PDF/gi, '').replace(/Download/gi, '').replace(/\s+/g, ' ').trim();

    let cover_url = $('.entry-content img').first().attr('src') || $('.wp-post-image').attr('src');
    
    let pdf_url = null;
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('archive.org') || href.endsWith('.pdf'))) {
        if (!pdf_url) pdf_url = href;
        if (href.includes('archive.org') && !href.includes('details')) {
          pdf_url = href; // prefer direct
        }
      }
    });

    if (!pdf_url) return null; // Can't add without PDF link

    const directLink = getDirectArchiveLink(pdf_url);
    const sub_category = determineSubCategory(title);

    return {
      title,
      author: 'BestUrduBooks',
      category: 'درجہ اولیٰ',
      sub_category,
      pdf_url: directLink,
      cover_url: cover_url || ''
    };
  } catch (err) {
    console.error(`Error details for ${url}:`, err.message);
    return null;
  }
}

async function main() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-aula-1st-year/';
  const allBookLinks = new Set();
  
  console.log("Fetching book links from Al-Aula pages...");
  // Scrape first page
  const page1 = await scrapePage(baseUrl);
  page1.forEach(b => allBookLinks.add(b.link));

  // Loop through page 2 to 12
  for (let i = 2; i <= 12; i++) {
    const pageUrl = `${baseUrl}page/${i}/`;
    console.log(`Scraping ${pageUrl}`);
    const results = await scrapePage(pageUrl);
    if (results.length === 0) break; // Finished pagination
    results.forEach(b => allBookLinks.add(b.link));
  }

  console.log(`Found ${allBookLinks.size} total unique book URLs.`);
  
  const booksData = [];
  const linksArray = Array.from(allBookLinks);

  for (let i = 0; i < linksArray.length; i++) {
    console.log(`[${i+1}/${linksArray.length}] Fetching ${linksArray[i]}`);
    const data = await scrapeBookDetail(linksArray[i]);
    if (data) {
      booksData.push({ ...data, id: Date.now().toString() + i });
    }
    // simple delay to not overload server
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`Successfully extracted ${booksData.length} books.`);
  fs.writeFileSync('al_aula_books.json', JSON.stringify(booksData, null, 2));

  console.log("Uploading to Supabase...");
  // Upsert in batches of 50
  for (let i = 0; i < booksData.length; i += 50) {
    const batch = booksData.slice(i, i + 50);
    const { data, error } = await supabase.from('Books').upsert(batch, { onConflict: 'title, category' });
    if (error) {
      console.error("Supabase insert error:", error);
    } else {
      console.log(`Inserted batch ${i/50 + 1}`);
    }
  }

  console.log("Done!");
}

main();
