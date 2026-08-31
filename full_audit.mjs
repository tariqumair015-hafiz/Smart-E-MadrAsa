import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fullAudit() {
  console.log("Fetching all books from database...");
  let allBooks = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('Books')
      .select('id, title, author, cover_url, sub_category')
      .range(offset, offset + batchSize - 1);
    
    if (error || !data || data.length === 0) break;
    allBooks.push(...data);
    offset += batchSize;
    if (data.length < batchSize) break;
  }

  console.log(`Auditing ${allBooks.length} books...`);
  
  const results = {
    missing: [], // null or empty
    broken: [],  // 404 or unreachable
    placeholder: [], // looks like a generic colored cover (based on size/commonality)
    valid: 0
  };

  const concur = 50;
  const sizeMap = {}; // To find common placeholder sizes

  for (let i = 0; i < allBooks.length; i += concur) {
    const slice = allBooks.slice(i, i + concur);
    await Promise.all(slice.map(async (book) => {
      if (!book.cover_url) {
        results.missing.push(book);
        return;
      }

      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(book.cover_url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(tid);

        if (!res.ok) {
          results.broken.push(book);
        } else {
          const size = res.headers.get('content-length');
          if (size) {
            sizeMap[size] = (sizeMap[size] || 0) + 1;
            book.tempSize = size;
          }
          results.valid++;
        }
      } catch (e) {
        results.broken.push(book);
      }
    }));
    if (i % 500 === 0) console.log(`Progress: ${i}/${allBooks.length}...`);
  }

  // Detect likely placeholders by file size commonality
  // If many books share the exact same byte size (and it's small, e.g. < 50k), it's likely a placeholder.
  const commonSizes = Object.entries(sizeMap)
    .filter(([size, count]) => count > 5) // Shared by more than 5 books
    .map(e => e[0]);

  // Re-classify placeholders from the "valid" set
  // This is a bit complex as "valid" was just a counter, so we check book.tempSize
  const placeholdersDetected = [];
  const actuallyValid = [];

  allBooks.forEach(book => {
    if (book.tempSize && commonSizes.includes(book.tempSize)) {
      results.placeholder.push(book);
    }
  });

  // Generate Report content
  let report = `--- HAFIZ MADARSA PRO: BOOK COVER AUDIT REPORT ---\n`;
  report += `Date: ${new Date().toLocaleString()}\n`;
  report += `Total Books Audited: ${allBooks.length}\n\n`;
  
  report += `SUMMARY:\n`;
  report += `- Definitely Missing (NULL): ${results.missing.length}\n`;
  report += `- Broken Links (404/Timeout): ${results.broken.length}\n`;
  report += `- Generic Image Placeholders Found: ${results.placeholder.length}\n`;
  report += `- Estimated Total Quality Covers: ${allBooks.length - results.missing.length - results.broken.length - results.placeholder.length}\n\n`;

  report += `=== LIST OF BOOKS REQUIRING COVERS ===\n\n`;

  const addToList = (list, type) => {
    report += `CATEGORY: ${type} (${list.length} items)\n`;
    list.forEach((b, idx) => {
      report += `${idx + 1}. [ID: ${b.id}] ${b.title} (${b.author || 'No Author'}) [Scholar: ${b.sub_category}]\n`;
    });
    report += `\n`;
  };

  addToList(results.missing, "MISSING (NULL URL)");
  addToList(results.broken, "BROKEN LINKS");
  addToList(results.placeholder, "GENERIC COLORED PLACEHOLDERS (Likely)");

  fs.writeFileSync('full_audit_report.txt', report);
  console.log("Full audit completed and saved to full_audit_report.txt");
}

fullAudit();
