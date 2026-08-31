import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const landingUrl = 'https://besturdubooks.net/dars-e-nizami-banat-girls/khasa-banat-second-year-books/';
  console.log("Fetching Landing Page...");
  const { data: landingHtml } = await axios.get(landingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
  
  const $l = cheerio.load(landingHtml);
  const linksData = [];
  
  $l('.entry-content a').each((i, el) => {
      const href = $l(el).attr('href');
      let text = $l(el).text().trim();
      
      // If the link contains an image and no text, we can try to extract from parent or nearby
      if (!text) {
          text = $l(el).parent().text().trim();
      }
      
      if (href && href.startsWith('https://besturdubooks.net/') && 
          !href.includes('/category/') && !href.includes('/tag/') && 
          !href.includes('/author/') && href.length > 30) {
          
          let subCat = "درسی کتب";
          const titleLower = text.toLowerCase();
          
          if (text.includes("شرح") || text.includes("شروحات") || text.includes("حل") || 
              text.includes("حاشیہ") || text.includes("اردو") || text.includes("دروس") || 
              text.includes("توضیح") || text.includes("کلید") || titleLower.includes("sharah")) {
              subCat = "اردو شروحات";
          }
          
          const pText = $l(el).parent().text();
          if (pText.includes("شروحات") || pText.includes("شرح")) {
              subCat = "اردو شروحات";
          }

          if (!linksData.some(l => l.href === href)) {
              linksData.push({ text: text || 'Unknown Book', href, subCat });
          }
      }
  });

  console.log(`Found ${linksData.length} unique book links.`);
  const allBooks = [];

  for (let i = 0; i < linksData.length; i++) {
    const item = linksData[i];
    console.log(`[${i+1}/${linksData.length}] Fetching ${item.text}... URL: ${item.href}`);

    try {
      const { data } = await axios.get(item.href, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
      const $ = cheerio.load(data);
      
      let title = item.text;
      if (title === 'Unknown Book') {
         title = $('h1.entry-title').text().trim() || $('h1').first().text().trim() || title;
      }
      
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
         const btnHref = $('.wp-block-button__link').attr('href') || $('.elementor-button-link').attr('href');
         if (btnHref) {
           volumes.push({ title: 'Download', url: btnHref });
         }
      }

      // Cover image
      let bookImg = $('.entry-content img').not('.swp_share_buttons img').not('.avatar').first().attr('src') || $('img.wp-post-image').attr('src');
      if (bookImg && bookImg.startsWith('//')) bookImg = 'https:' + bookImg;
      if (!bookImg) bookImg = 'https://via.placeholder.com/300x450?text=No+Cover';

      // Text Details
      const textBody = $('body').text().replace(/\\s+/g, ' ');
      
      let authorMatches = textBody.match(/(?:تالیف|تأليف|مصنف|مؤلف|از)\\s*[:：]?\\s*([^\\n]+)/);
      let author = authorMatches ? authorMatches[1].trim() : "نامعلوم";
      if (author.length > 80) author = author.substring(0, 80).trim();

      let pagesMatch = textBody.match(/صفحات\\s*[:：]?\\s*(\\d+)/);
      let pages = pagesMatch ? parseInt(pagesMatch[1]) : 0;
      
      let subCat = item.subCat;
      if (title.includes("کلید") || title.includes("حل")) subCat = "اردو شروحات";
      
      if (volumes.length > 0) {
        allBooks.push({
          title: title,
          author: author,
          category: 'ثانویہ خاصہ سال دوم',
          sub_category: subCat,
          cover_url: bookImg,
          pdf_url: volumes[0].url,
          description: JSON.stringify(volumes),
          pages: pages,
          is_free: true,
          downloads: 0,
          rating: 0,
          language: 'ur',
          year: 10
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
