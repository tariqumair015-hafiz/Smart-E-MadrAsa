import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const scholars = [
  "maulana-sarfaraz-safdar",
  "maulana-tariq-jameel",
  "maulana-zahid-ur-rashdi",
  "maulana-zakariyya-kandhelvi",
  "maulana-zulfiqar-naqshbandi",
  "mufti-abu-lubaba",
  "mufti-akhtar-imam-adil",
  "mufti-inam-ul-haq",
  "mufti-muhammad-shafi",
  "mufti-muhammad-taqi-usmani",
  "mufti-jafar-milly",
  "mufti-rasheed-ludhianvi",
  "mufti-shoaibullah-miftahi",
  "muhammad-ishaq-multani"
];

async function check() {
  const results = [];
  results.push("=== Scholar Books Audit (After Palanpuri) ===\n");

  for (const s of scholars) {
    const { data: books, count, error } = await supabase
      .from('Books')
      .select('title, description, pdf_url', { count: 'exact' })
      .eq('sub_category', s);
      
    if (error) {
      results.push(`ERROR for ${s}: ${error.message}`);
      continue;
    }

    let multiVolCount = 0;
    let singleVolCount = 0;
    const sampleSingleVol = [];

    if (books) {
      books.forEach(b => {
        try {
          const v = JSON.parse(b.description || '[]');
          if (Array.isArray(v) && v.length > 1) {
            multiVolCount++;
          } else {
            singleVolCount++;
            if (sampleSingleVol.length < 3) {
              sampleSingleVol.push(b.title);
            }
          }
        } catch(e) {
          singleVolCount++;
          if (sampleSingleVol.length < 3) {
            sampleSingleVol.push(b.title);
          }
        }
      });
    }

    results.push(`Scholar: ${s}`);
    results.push(`  Total Books: ${count}`);
    results.push(`  Multi-Volume: ${multiVolCount}`);
    results.push(`  Single-Volume Only: ${singleVolCount}`);
    if (sampleSingleVol.length > 0) {
      results.push(`  Sample single-vol titles: ${sampleSingleVol.join(' | ')}`);
    }
    results.push('');
  }

  const output = results.join('\n');
  fs.writeFileSync('tmp/scholars_audit.txt', output, 'utf8');
  console.log(output);
  console.log("Results saved to tmp/scholars_audit.txt");
}

check();
