import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import axios from 'axios';

const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Disable worker & font rendering for pure Node text extraction
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

async function verifyAndSelect3Books() {
  console.log('🔍 Searching Supabase Books table for text-layer PDFs...\n');

  const { data: books, error } = await supabase
    .from('Books')
    .select('id, title, pdf_url, category, sub_category')
    .not('pdf_url', 'is', null)
    .neq('pdf_url', '')
    .limit(30);

  if (error || !books || books.length === 0) {
    console.error('❌ Failed to fetch books:', error);
    return;
  }

  const verifiedTextBooks = [];

  for (const book of books) {
    if (verifiedTextBooks.length >= 3) break;

    try {
      // Fetch small byte range (first 500KB) or full head/buffer to test PDF structure & text layer
      const resp = await axios.get(book.pdf_url, {
        responseType: 'arraybuffer',
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      const pdfData = new Uint8Array(resp.data);
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false,
      });

      const pdfDoc = await loadingTask.promise;

      // Extract text from page 1 & 2
      let page1Text = '';
      if (pdfDoc.numPages >= 1) {
        const page1 = await pdfDoc.getPage(1);
        const content = await page1.getTextContent();
        page1Text = content.items.map(item => item.str).join(' ').trim();
      }

      let page2Text = '';
      if (pdfDoc.numPages >= 2) {
        const page2 = await pdfDoc.getPage(2);
        const content = await page2.getTextContent();
        page2Text = content.items.map(item => item.str).join(' ').trim();
      }

      const combinedText = (page1Text + ' ' + page2Text).replace(/\s+/g, ' ');

      // A text-layer PDF will yield selectable Unicode text characters (e.g. Urdu/Arabic/English)
      if (combinedText.length > 80) {
        verifiedTextBooks.push({
          id: book.id,
          title: book.title,
          category: book.category,
          sub_category: book.sub_category,
          pdf_url: book.pdf_url,
          totalPages: pdfDoc.numPages,
          sampleText: combinedText.slice(0, 250),
        });
        console.log(`✅ Text-Layer Verified: [${book.id}] "${book.title}"`);
        console.log(`   Sample Text: "${combinedText.slice(0, 120)}..."\n`);
      } else {
        console.log(`⚠️ Scanned Image PDF (No text layer): "${book.title}" (Length: ${combinedText.length})\n`);
      }
    } catch (err) {
      console.log(`❌ Skipped "${book.title}": ${err.message}\n`);
    }
  }

  console.log('==================================================');
  console.log('📌 FINAL 3 VERIFIED TEXT-LAYER BOOKS FOR TEST:');
  console.log('==================================================');
  console.log(JSON.stringify(verifiedTextBooks, null, 2));
}

verifyAndSelect3Books();
