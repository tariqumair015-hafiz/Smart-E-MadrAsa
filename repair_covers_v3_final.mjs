import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSearchQuery(title) {
  const urduMatch = title.match(/[\u0600-\u06FF\u0750-\u077F\u0FB50-\u0FDFF\u0FE70-\u0FEFF]+/g);
  if (urduMatch) {
    return urduMatch.join(' ').split(' ').slice(0, 3).join(' ');
  }
  return title.split(/By|از/i)[0].trim().split(' ').slice(0, 2).join(' ');
}

async function repairBatch(startIndex, count) {
  const content = fs.readFileSync('full_cover_audit.txt', 'utf8');
  const lines = content.split('\n');
  const targetBooks = [];

  for (const line of lines) {
    const match = line.match(/^\d+\. \[ID: (\d+)\] (.*?) \((.*?)\)$/);
    if (match) {
      targetBooks.push({ id: match[1], title: match[2].trim() });
    }
  }

  const batch = targetBooks.slice(startIndex, startIndex + count);
  console.log(`Repairing batch ${startIndex} to ${startIndex + batch.length - 1} (${batch.length} books)`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const book of batch) {
    const query = getSearchQuery(book.title);
    console.log(`\n[${book.id}] Searching: "${query}"`);
    
    try {
      await page.goto(`https://besturdubooks.net/?s=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      const bestImage = await page.evaluate(() => {
        const possibleImages = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt || ''
        })).filter(img => 
          img.src.includes('.jpg') || img.src.includes('.png') || img.src.includes('.webp')
        ).filter(img => !img.src.includes('logo') && !img.src.includes('placeholder') && !img.src.includes('avatar'));
        return possibleImages.length > 0 ? possibleImages[0].src : null;
      });

      if (bestImage) {
        console.log(`  Found: ${bestImage}`);
        await supabase.from('Books').update({ cover_url: bestImage }).eq('id', book.id);
        console.log(`  Updated.`);
      } else {
        console.log(`  X No image. Nulling.`);
        await supabase.from('Books').update({ cover_url: null }).eq('id', book.id);
      }
    } catch (e) {
      console.error(`  X Error: ${e.message}`);
    }
  }
  await browser.close();
}

// Remaining books
repairBatch(50, 100);
