import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import sharp from 'sharp';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_TITLES = [
  'انعامات المنعم',
  'درس مسلم',
  'ابو داؤد',
  'جامع الترمذی',
  'شمائل ترمذی',
  'بخاری شریف',
  'مشکوۃ المصابیح',
  'صحیح مسلم',
  'تیسیر المنطق',
  'صحیح البخاری'
];

async function masterCleanup() {
  console.log("Starting Full Library Master Cleanup...");

  let allBooks = [];
  let from = 0;
  const range = 1000;

  while (true) {
    const { data, error } = await supabase.from('Books').select('id, title, cover_url').range(from, from + range - 1);
    if (error) break;
    if (data.length === 0) break;
    allBooks.push(...data);
    from += range;
  }

  console.log(`Analyzing ${allBooks.length} books...`);

  const idsToNull = new Set();

  for (const book of allBooks) {
    if (TARGET_TITLES.some(t => book.title.includes(t))) {
      idsToNull.add(book.id);
    }
  }

  const booksWithCovers = allBooks.filter(b => b.cover_url && b.cover_url.startsWith('http'));
  console.log(`Checking dimensions for ${booksWithCovers.length} covers...`);

  for (let i = 0; i < booksWithCovers.length; i += 50) {
    const batch = booksWithCovers.slice(i, i + 50);
    await Promise.all(batch.map(async (book) => {
      try {
        const response = await axios.get(book.cover_url, { responseType: 'arraybuffer', timeout: 3000 });
        const metadata = await sharp(response.data).metadata();
        if (metadata.width > metadata.height) {
          console.log(`[Landscape] ${book.id}: ${book.title}`);
          idsToNull.add(book.id);
        }
      } catch (e) { }
    }));
    process.stdout.write(`.`);
  }

  const finalIds = Array.from(idsToNull);
  console.log(`\nFinal count to null: ${finalIds.length}`);

  if (finalIds.length > 0) {
    for (let i = 0; i < finalIds.length; i += 50) {
      const batch = finalIds.slice(i, i + 50);
      await supabase.from('Books').update({ cover_url: null }).in('id', batch);
    }
    console.log("Cleanup complete.");
  }
}

masterCleanup();
