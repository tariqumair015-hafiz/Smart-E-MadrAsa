import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = JSON.parse(fs.readFileSync('./env_config.json', 'utf8'));

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data, error, count } = await supabase.from('Books').select('id, title, cover_url, pdf_url', { count: 'exact' }).limit(10);
  if (error) {
    console.error('Error fetching books:', error);
    return;
  }
  console.log('Total Books count in Supabase:', count);
  console.log('Sample 5 books:', JSON.stringify(data.slice(0, 5), null, 2));

  let page = 0;
  const pageSize = 1000;
  let allBooks = [];
  while (true) {
    const { data: chunk, error: err } = await supabase
      .from('Books')
      .select('id, title, cover_url, pdf_url')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (err || !chunk || chunk.length === 0) break;
    allBooks.push(...chunk);
    page++;
  }

  console.log(`Fetched total ${allBooks.length} records for analysis.`);

  const coverDomains = {};
  const pdfDomains = {};

  for (const b of allBooks) {
    if (b.cover_url) {
      try {
        const domain = new URL(b.cover_url).hostname;
        coverDomains[domain] = (coverDomains[domain] || 0) + 1;
      } catch (e) {
        coverDomains['invalid/relative'] = (coverDomains['invalid/relative'] || 0) + 1;
      }
    } else {
      coverDomains['null/empty'] = (coverDomains['null/empty'] || 0) + 1;
    }

    if (b.pdf_url) {
      try {
        const domain = new URL(b.pdf_url).hostname;
        pdfDomains[domain] = (pdfDomains[domain] || 0) + 1;
      } catch (e) {
        pdfDomains['invalid/relative'] = (pdfDomains['invalid/relative'] || 0) + 1;
      }
    } else {
      pdfDomains['null/empty'] = (pdfDomains['null/empty'] || 0) + 1;
    }
  }

  console.log('Cover URL domains:', coverDomains);
  console.log('PDF URL domains:', pdfDomains);
}

inspect();
