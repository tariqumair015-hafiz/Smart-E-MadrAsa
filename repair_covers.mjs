import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function repairCovers() {
  const content = fs.readFileSync('full_cover_audit.txt', 'utf8');
  const lines = content.split('\n');
  const targetBooks = [];

  // Parse books from report
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

  // Process a batch of 20 books first
  const batch = targetBooks.slice(0, 20);

  for (const book of batch) {
    console.log(`\nRepairing: [${book.id}] ${book.title}`);
    
    // Clean title for search (remove Urdu extra text if possible or just use the whole string)
    const searchQuery = book.title.split('By')[0].trim();
    const searchUrl = `https://besturdubooks.net/?s=${encodeURIComponent(searchQuery)}`;
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Look for result items
      const results = await page.$$eval('.post-item, .product-item, .item', items => {
         return items.map(item => {
           const titleEl = item.querySelector('h2, h3, .title');
           const imgEl = item.querySelector('img');
           return {
             title: titleEl ? titleEl.innerText.trim() : '',
             img: imgEl ? imgEl.src : ''
           };
         });
      });

      if (results.length > 0) {
        // Find best match (simple jaro-winkler or just first relevant)
        let foundCover = null;
        for (const res of results) {
          if (res.img && !res.img.includes('placeholder')) {
             // Basic heuristic: check if more than 30% of words overlap
             foundCover = res.img;
             console.log(`  Found potential cover: ${foundCover}`);
             break;
          }
        }

        if (foundCover) {
          const { error } = await supabase
            .from('Books')
            .update({ cover_url: foundCover })
            .eq('id', book.id);
          if (error) console.error(`  Update error for ${book.id}:`, error.message);
          else console.log(`  Successfully updated ${book.id}`);
        } else {
          console.log(`  No valid image found for ${book.id}. Leaving null.`);
          await supabase.from('Books').update({ cover_url: null }).eq('id', book.id);
        }
      } else {
        console.log(`  No search results for ${book.id}. Leaving null.`);
        await supabase.from('Books').update({ cover_url: null }).eq('id', book.id);
      }
    } catch (e) {
      console.error(`  Error processing ${book.id}:`, e.message);
    }
  }

  await browser.close();
  console.log("\nBatch complete.");
}

repairCovers();
