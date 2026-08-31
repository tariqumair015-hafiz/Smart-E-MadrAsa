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
  console.log("Starting Master Cleanup...");

  // 1. Fetch all books
  const { data: books, error } = await supabase.from('Books').select('id, title, cover_url');
  if (error) {
    console.error("Error fetching books:", error);
    return;
  }
  console.log(`Analyzing ${books.length} books...`);

  const idsToNull = new Set();

  // 2. Identify by title
  for (const book of books) {
    if (TARGET_TITLES.some(t => book.title.includes(t))) {
      console.log(`[Title Match] Queuing ID ${book.id}: ${book.title}`);
      idsToNull.add(book.id);
    }
  }

  // 3. Identify by Landscape orientation (Width > Height)
  // We'll process a batch of 100 books for landscape check to save time/resources
  // Or at least those that have a cover_url
  const booksWithCovers = books.filter(b => b.cover_url && b.cover_url.startsWith('http'));
  console.log(`Checking dimensions for ${booksWithCovers.length} covers...`);

  // We'll process 10 at a time to avoid hitting limits
  for (let i = 0; i < booksWithCovers.length; i += 20) {
    const batch = booksWithCovers.slice(i, i + 20);
    await Promise.all(batch.map(async (book) => {
      try {
        const response = await axios.get(book.cover_url, { responseType: 'arraybuffer', timeout: 5000 });
        const metadata = await sharp(response.data).metadata();
        if (metadata.width > metadata.height) {
          console.log(`[Landscape Match] Queuing ID ${book.id}: ${book.title} (${metadata.width}x${metadata.height})`);
          idsToNull.add(book.id);
        }
      } catch (e) {
        // If image fails to load, it might be broken, but we only care about landscape for now.
        // If it's already broken, it should have been caught by audit, but we can null it too if we want.
      }
    }));
    console.log(`Processed ${i + batch.length}/${booksWithCovers.length}...`);
  }

  const finalIds = Array.from(idsToNull);
  console.log(`\nFinal count to null: ${finalIds.length}`);

  if (finalIds.length > 0) {
    // 4. Perform Update
    for (let i = 0; i < finalIds.length; i += 50) {
      const batch = finalIds.slice(i, i + 50);
      const { error: updError } = await supabase
        .from('Books')
        .update({ cover_url: null })
        .in('id', batch);
      if (updError) console.error(`Error updating batch ${i}:`, updError.message);
    }
    console.log("Successfully nulled target covers.");
  } else {
    console.log("No covers matched for nulling.");
  }
}

masterCleanup();
