import fs from 'fs';
import path from 'path';

const LOCAL_EXTRACTED_DIR = 'C:\\smart_extractor\\extracted_books';
const METADATA_PATH = 'C:\\smart_extractor\\books_metadata.json';

try {
  if (!fs.existsSync(METADATA_PATH)) {
    console.log(`❌ Metadata file not found at ${METADATA_PATH}`);
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
  const r2Books = metadata.filter(b => b.pdf_url && !b.pdf_url.includes('supabase.co'));
  const supabaseBooks = metadata.filter(b => !b.pdf_url || b.pdf_url.includes('supabase.co'));

  let localFiles = [];
  if (fs.existsSync(LOCAL_EXTRACTED_DIR)) {
    localFiles = fs.readdirSync(LOCAL_EXTRACTED_DIR).filter(f => f.endsWith('.json'));
  }

  const localFilesSet = new Set(localFiles.map(f => f.replace('book_', '').replace('.json', '')));
  const remainingR2PDFs = r2Books.filter(b => !localFilesSet.has(String(b.id)));

  console.log('=== STATUS SUMMARY ===');
  console.log(`Total books in metadata: ${metadata.length}`);
  console.log(`R2-hosted PDFs (ready/eligible): ${r2Books.length}`);
  console.log(`Supabase PDFs (locked/paused): ${supabaseBooks.length}`);
  console.log(`Locally extracted JSON files: ${localFiles.length}`);
  console.log(`Remaining R2 PDFs to extract: ${remainingR2PDFs.length}`);
  console.log(`Progress percentage: ${((localFiles.length / r2Books.length) * 100).toFixed(2)}%`);
  
  if (remainingR2PDFs.length > 0) {
    console.log('\nSample remaining books:');
    remainingR2PDFs.slice(0, 5).forEach((b, i) => {
      console.log(`- ID: ${b.id} | Title: ${b.title}`);
    });
  }
} catch (error) {
  console.error('Error running check:', error);
}
