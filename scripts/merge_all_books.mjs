import fs from 'fs';
import path from 'path';

const filesToMerge = [
  'books_metadata.json',
  'al_aula_books.json',
  'sania_final_books.json',
  'salesa_final_books.json',
  'rabia_final_books.json',
  'khamesa_final_books.json',
  'sadesa_final_books.json',
  'sabea_final_books.json',
  'daura_books_expanded.json',
  'palanpuri_books.json',
  'safdar_books.json',
  'nanotvi_books.json',
  'yusuf_books.json',
  'idrees_books.json',
  'tayyab_books.json',
  'naqshbandi_books.json',
  'perfect_scrape.json'
];

let allBooks = [];
let nextId = 900000;
const seenTitles = new Set();

filesToMerge.forEach(file => {
  if (!fs.existsSync(file)) return;
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const items = JSON.parse(raw);
    console.log(`Loading ${items.length} books from ${file}...`);
    items.forEach(item => {
      // Clean up category names
      let category = item.category || 'متفرق';
      if (category.includes('ثانیہ')) category = 'درجہ ثانیہ';
      else if (category.includes('ثالثہ')) category = 'درجہ ثالثہ';
      else if (category.includes('اولیٰ')) category = 'درجہ اولیٰ';
      else if (category.includes('رابعہ')) category = 'درجہ رابعہ';
      else if (category.includes('خامسہ')) category = 'درجہ خامسہ';
      else if (category.includes('سادسہ')) category = 'درجہ سادسہ';
      else if (category.includes('سابعہ')) category = 'درجہ سابعہ';
      else if (category.includes('حدیث') || category.includes('دورہ')) category = 'دورہ حدیث';

      const title = (item.title || '').trim();
      if (!title) return;

      const dedupeKey = title.toLowerCase() + '_' + category;
      if (seenTitles.has(dedupeKey)) return;
      seenTitles.add(dedupeKey);

      let coverUrl = item.cover_url || item.cover || '';
      if (coverUrl.includes('supabase.co')) {
        coverUrl = coverUrl.replace(/https:\/\/ymizqgtlnhvkqlidftiy\.supabase\.co\/storage\/v1\/object\/public\/(book-covers\/covers|books-pdfs\/covers|scholar-images)\//g, 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/covers/');
        coverUrl = coverUrl.replace(/https:\/\/ymizqgtlnhvkqlidftiy\.supabase\.co\/storage\/v1\/object\/public\/[^\/]+\//g, 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/covers/');
      }

      let pdfUrl = item.pdf_url || item.url || '';
      if (pdfUrl.includes('supabase.co')) {
        pdfUrl = pdfUrl.replace(/https:\/\/ymizqgtlnhvkqlidftiy\.supabase\.co\/storage\/v1\/object\/public\/books-pdfs\/pdfs\//g, 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/pdfs/');
      }

      let description = item.description || (item.volumes ? JSON.stringify(item.volumes) : null);
      if (description && description.includes('supabase.co')) {
        description = description.replace(/https:\/\/ymizqgtlnhvkqlidftiy\.supabase\.co\/storage\/v1\/object\/public\/books-pdfs\/pdfs\//g, 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/pdfs/');
      }

      const bookObj = {
        id: item.id || nextId++,
        title: title,
        author: item.author || 'BestUrduBooks',
        category: category,
        sub_category: item.sub_category || 'درسی کتب',
        cover_url: coverUrl,
        pdf_url: pdfUrl,
        pages: item.pages || 0,
        size_mb: item.size_mb || 0,
        is_free: 't',
        price: 0,
        downloads: item.downloads || 0,
        rating: item.rating || 0,
        description: description,
        language: item.language || 'ur',
        year: item.year || null,
        created_at: item.created_at || new Date().toISOString()
      };

      allBooks.push(bookObj);
    });
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

console.log(`\n🎉 Total Merged Master Books Count: ${allBooks.length}`);

// Write master file
fs.writeFileSync('books_metadata.json', JSON.stringify(allBooks, null, 2));

// Copy to public/ and dist/
fs.writeFileSync(path.resolve('public/books_metadata.json'), JSON.stringify(allBooks));
if (fs.existsSync(path.resolve('dist'))) {
  fs.writeFileSync(path.resolve('dist/books_metadata.json'), JSON.stringify(allBooks));
}

console.log(`✅ Master books_metadata.json successfully created and copied to public/ and dist/! File size: ${(fs.statSync('public/books_metadata.json').size / 1024 / 1024).toFixed(2)} MB`);
