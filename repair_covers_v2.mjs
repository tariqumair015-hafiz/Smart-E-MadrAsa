import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanSearchTerm(title) {
  // Regex to extract Urdu script
  const urduMatch = title.match(/[\u0600-\u06FF\u0750-\u077F\u0FB50-\u0FDFF\u0FE70-\u0FEFF\u0590-\u05FF]+/g);
  if (urduMatch) {
    return urduMatch.join(' ').substring(0, 30); // Use Urdu words
  }
  // Fallback to first few words before "By" or "از"
  return title.split(/By|از/i)[0].trim();
}

async function repairCovers() {
  const content = fs.readFileSync('full_cover_audit.txt', 'utf8');
  const lines = content.split('\n');
  const targetBooks = [];

  for (const line of lines) {
    const match = line.match(/^\d+\. \[ID: (\d+)\] (.*?) \((.*?)\)$/);
    if (match) {
      targetBooks.push({
        id: parseInt(match[1]),
        title: match[2].trim(),
        category: match[3].trim()
      });
    }
  }

  console.log(`Loaded ${targetBooks.length} books for repair.`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const batch = targetBooks.slice(0, 25); // Test 25 books

  for (const book of batch) {
    const query = cleanSearchTerm(book.title);
    console.log(`\nOriginal: ${book.title}`);
    console.log(`Searching for: ${query}`);
    
    const searchUrl = `https://besturdubooks.net/?s=${encodeURIComponent(query)}`;
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      const results = await page.$$eval('.post-item, .product-item, .item, .entry-content', items => {
         return items.map(item => {
           const titleEl = item.querySelector('h2, h3, .title, .entry-title');
           const imgEl = item.querySelector('img');
           return {
             title: titleEl ? titleEl.innerText.trim() : '',
             img: imgEl ? imgEl.src : ''
           };
         }).filter(r => r.img && !r.img.includes('placeholder'));
      });

      if (results.length > 0) {
        // Simple relevance matching
        const best = results[0];
        console.log(`  Match: ${best.title.substring(0,40)}...`);
        console.log(`  Image: ${best.img}`);

        const { error } = await supabase
          .from('Books')
          .update({ cover_url: best.img })
          .eq('id', book.id);
        if (error) console.error(`  Supabase error:`, error.message);
        else console.log(`  Updated!`);
      } else {
        console.log(`  FAIL: No search results found.`);
      }
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
    }
  }

  await browser.close();
  console.log("\nRepair turn complete.");
}

repairCovers();
