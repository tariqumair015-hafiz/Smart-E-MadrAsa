import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const linksData = JSON.parse(fs.readFileSync('tmp/khasa_1_links.json', 'utf8'));
  const allBooks = [];

  for (let i = 0; i < linksData.length; i++) {
    const item = linksData[i];
    console.log(`[${i+1}/${linksData.length}] Fetching ${item.text}... URL: ${item.href}`);

    try {
      const { data } = await axios.get(item.href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(data);
      
      let title = item.text;
      
      // Volumes
      let volumes = [];
      $('a').each((idx, link) => {
        const h = $(link).attr('href');
        let linkText = $(link).text().trim();
        if(!linkText || linkText.toLowerCase() === 'download') linkText = `جلد ${volumes.length + 1}`;
        
        if (h && (h.toLowerCase().includes('.pdf') || h.includes('archive.org/download/') || h.includes('mediafire.com/file/'))) {
           volumes.push({ title: linkText, url: h });
        }
      });
      volumes = [...new Map(volumes.map(v => [v.url, v])).values()];

      if (volumes.length === 0) {
         // Maybe a direct button
         const btnHref = $('.wp-block-button__link').attr('href') || $('.elementor-button-link').attr('href');
         if (btnHref) {
           volumes.push({ title: 'Download', url: btnHref });
         }
      }

      // Cover image
      let bookImg = $('img.wp-post-image').attr('src') || $('img.wp-post-image').attr('data-src') || $('.entry-content img').first().attr('src');
      if (!bookImg) {
          // fallback
          bookImg = 'https://via.placeholder.com/300x450?text=No+Cover';
      }

      // Text Details
      const textBody = $('body').text().replace(/\\s+/g, ' ');
      
      let authorMatches = textBody.match(/(?:تالیف|تأليف|مصنف|مؤلف|از)\\s*[:：]?\\s*([^\\n]+)/);
      let author = authorMatches ? authorMatches[1].trim() : "نامعلوم";
      if (author.length > 80) author = author.substring(0, 80).trim();

      let pagesMatch = textBody.match(/صفحات\\s*[:：]?\\s*(\\d+)/);
      let pages = pagesMatch ? parseInt(pagesMatch[1]) : 0;
      
      // Refine subcat just in case text contained Kaleed
      let subCat = item.subCat;
      if (title.includes("کلید") || title.includes("حل")) subCat = "شروحات";
      
      let year = 9; // If mapped to 9 for class 1 banat? Or we can let database use category name. The translation files don't strictly use year number, but `category` string.
      // Usually years 1-8 are boys, 9-14 are girls according to `delete_girls_books.mjs`! So 9 is Banat Year 1!

      if (volumes.length > 0) {
        allBooks.push({
          title: title,
          author: author,
          category: 'ثانویہ خاصہ سال اول',
          sub_category: subCat,
          cover_url: bookImg,
          pdf_url: volumes[0].url,
          description: JSON.stringify(volumes),
          pages: pages,
          is_free: true,
          downloads: 0,
          rating: 0,
          language: 'ur',
          year: 9 
        });
        console.log(`  -> SUCCESS! Found ${volumes.length} volumes. SubCat: ${subCat}`);
      } else {
        console.log(`  -> FAILED: No PDF links found.`);
      }
    } catch (e) {
      console.log(`  -> ERROR: ${e.message}`);
    }
    
    await delay(500);
  }

  if (allBooks.length > 0) {
     console.log(`\\nInserting ${allBooks.length} books into Supabase...`);
     const { data, error } = await supabase.from('Books').upsert(allBooks, { onConflict: 'pdf_url' }).select('id');
     if (error) {
       console.error("Upsert failed:", error);
     } else {
       console.log(`\\nSUCCESSFULLY ADDED ${data.length} BOOKS TO DATABASE!`);
     }
  } else {
     console.log("No valid books extracted.");
  }
}

run();
