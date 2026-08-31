/**
 * Final Scraper for Dars-e-Nizami 2nd Year (درجہ ثانیہ)
 * Syllabus-based classification
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';
const totalPages = 9;
const CATEGORY = 'درجہ ثانیہ (2nd Year)';

// ─── Syllabus textbook keywords ───────────────────────────────────
// Based on official Wifaq ul Madaris 2nd Year nisab:
// ترجمہ پارہ عم، فوائد مکیہ، زاد الطالبین، القراءة الراشدة، معلم الانشاء جلد اول
// مختصر القدوری، علم الصيغة مع خاصيات الأبواب، هداية النحو، تيسير المنطق، مرقاة
const DARSI_KEYWORDS = [
  'پارہ عم', 'para aam', 'para amm', 'ترجمہ پارہ',
  'فوائد مکیہ', 'fawaid makkiya', 'fawaidmakkiya',
  'زاد الطالبین', 'zad ul talibeen', 'zad al talibeen', 'zaad ul talibeen',
  'القراءة الراشدة', 'القراءة الراشدہ', 'qiraat ur rashida', 'qiraat al rashida', 'al qiraat al rashidah',
  'معلم الانشاء', 'moalim ul insha', 'mualim ul insha', 'muallim ul insha',
  'هداية النحو', 'ہدایۃ النحو', 'ہدایة النحو', 'hidayatun nahw', 'hidayat un nahw', 'hidaya al nahw',
  'علم الصيغة', 'علم الصیغہ', 'ilm us seegh', 'ilm al siga', 'ilm-al-siga',
  'خاصیات ابواب', 'khasiyat abwab', 'khasiyaat abwab', 'fasool akbari', 'فصول اکبری',
  'تیسیر المنطق', 'تيسير المنطق', 'tayseer ul mantiq', 'taiseer ul mantiq', 'taisir ul mantiq', 'taysir ul mantiq',
  'مرقاة', 'مرقات', 'mirqat', 'mirqaat',
];

// These words in title indicate commentary (not textbook)
const COMMENTARY_MARKERS = [
  'شرح', 'شروح', 'sharh ', 'sharah', ' sharh', 'حاشیہ', 'hashiya',
  'تشریح', 'tashrih', 'تقریر', 'آسان', 'asaan ', ' asan ', 'اردو شرح',
  'تبیین', 'tabyin', 'حل ', 'النور', 'اشراق', 'الخیر', 'فیض',
  'مسائل', ' msail', 'الجوہرة', 'امداد', 'imdad', 'الحل',
];

function classifyBook(title) {
  const t = (title || '').toLowerCase();
  
  // Check if it matches any darsi keyword
  const isDarsi = DARSI_KEYWORDS.some(kw => t.includes(kw.toLowerCase()));
  
  if (isDarsi) {
    // Check if it also has commentary markers (then it's a commentary OF the textbook)
    const hasCommentaryMarker = COMMENTARY_MARKERS.some(kw => t.includes(kw.toLowerCase()));
    if (hasCommentaryMarker) {
      // Exception: زاد الطالبین IS the textbook itself
      if (t.includes('زاد الطالبین') || t.includes('zad ul talibeen') || t.includes('zad al talibeen') || t.includes('zaad')) {
        return 'درسی کتب';
      }
      // Exception: Al Qiraat ur Rashida itself
      if (t.includes('قراءة الراشد') || t.includes('qiraat ur rashid') || t.includes('qiraat al rashid')) {
        return 'درسی کتب';
      }
      // It's a commentary of a textbook
      if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) return 'عربی شروحات';
      return 'اردو شروحات';
    }
    return 'درسی کتب';
  }
  
  // Not a darsi book — classify as commentary
  if (t.includes('عربی') || t.includes('arabic') || t.includes('عربیہ')) {
    return 'عربی شروحات';
  }
  return 'اردو شروحات';
}

async function scrape() {
  const allBooks = [];

  for (let page = 1; page <= totalPages; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}${page}/`;
    console.log(`\n📄 Scraping page ${page}: ${url}`);
    
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120' },
        timeout: 20000
      });
      const $ = cheerio.load(res.data);
      const content = $('.entry-content');

      // Find all book cover images in the post content
      const images = content.find('img');
      console.log(`  Images found: ${images.length}`);
      
      images.each((i, imgEl) => {
        const img = $(imgEl);
        
        // Extract cover URL (handle lazy loading)
        let coverUrl = img.attr('data-lazy-src') 
          || img.attr('data-src') 
          || img.attr('data-orig-src') 
          || img.attr('src') 
          || '';
        
        // Skip logos, spacers, icons
        if (!coverUrl 
            || coverUrl.includes('logo') 
            || coverUrl.includes('besturdubooks-net.png') 
            || coverUrl.includes('placeholder')
            || coverUrl.includes('icon')
            || coverUrl.length < 20) return;
        
        // Strip Jetpack/CDN resize params
        if (coverUrl.includes('i2.wp.com') || coverUrl.includes('i0.wp.com') || coverUrl.includes('i1.wp.com')) {
          const cleaned = coverUrl.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://');
          coverUrl = cleaned.split('?')[0];
        } else if (coverUrl.includes('?')) {
          coverUrl = coverUrl.split('?')[0];
        }

        // ── Title extraction: look backwards from the image ──
        let title = '';
        let prev = img.parent().prev();
        let searchLimit = 0;
        while (prev.length && !title && searchLimit < 8) {
          const text = prev.text().trim();
          if (text 
              && text.length > 5 
              && !text.toLowerCase().includes('click here')
              && !text.toLowerCase().includes('download link')
              && !text.toLowerCase().includes('nisab')
              && !text.match(/^\d+\.$/)
          ) {
            title = text;
          }
          prev = prev.prev();
          searchLimit++;
        }
        
        if (!title) {
          // Try alt text of image
          title = img.attr('alt') || '';
        }

        // ── Volumes extraction: look forward from image for download links ──
        const volumes = [];
        let next = img.parent().next();
        let limit = 0;
        
        while (next.length && limit < 12) {
          // Stop if we hit another image (next book)
          if (next.find('img').length > 0 && limit > 0) break;
          
          next.find('a').each((j, linkEl) => {
            const link = $(linkEl);
            const href = link.attr('href') || '';
            const text = link.text().trim();
            
            // Only include genuine download links
            if (href && (
              href.includes('archive.org/download') ||
              href.includes('archive.org/details') ||
              href.includes('mediafire.com') ||
              href.includes('drive.google.com') ||
              href.includes('dropbox.com')
            )) {
              let volTitle = text || `Volume ${volumes.length + 1}`;
              // Clean up noisy titles
              if (!volTitle || volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('click here')) {
                volTitle = `Link ${volumes.length + 1}`;
              }
              
              // Convert details → download for archive.org
              let downloadUrl = href;
              if (href.includes('archive.org/details/')) {
                downloadUrl = href.replace('/details/', '/download/');
              }
              
              volumes.push({ title: volTitle, url: downloadUrl });
            }
          });
          
          next = next.next();
          limit++;
        }

        // Only save if we have title and at least one download link
        if (title && volumes.length > 0) {
          // Clean title
          title = title
            .replace(/Download Link \d+/gi, '')
            .replace(/^\d+\.\s*/, '')
            .trim();
          
          const sub_category = classifyBook(title);
          
          allBooks.push({
            title,
            cover_url: coverUrl,
            volumes,
            pdf_url: volumes[0].url,
            sub_category,
            category: CATEGORY,
          });
          
          console.log(`  ✅ [${sub_category}] ${title.substring(0, 60)}`);
        }
      });

    } catch (err) {
      console.error(`  ❌ Error on page ${page}:`, err.message);
    }
  }

  // Save results
  fs.writeFileSync('sania_final_books.json', JSON.stringify(allBooks, null, 2), 'utf8');
  
  const textbooks = allBooks.filter(b => b.sub_category === 'درسی کتب');
  const urduSharah = allBooks.filter(b => b.sub_category === 'اردو شروحات');
  const arabicSharah = allBooks.filter(b => b.sub_category === 'عربی شروحات');
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ SCRAPING COMPLETE!`);
  console.log(`   Total books: ${allBooks.length}`);
  console.log(`   درسی کتب (Textbooks): ${textbooks.length}`);
  console.log(`   اردو شروحات: ${urduSharah.length}`);
  console.log(`   عربی شروحات: ${arabicSharah.length}`);
  console.log(`   Saved to: sania_final_books.json`);
}

scrape();
