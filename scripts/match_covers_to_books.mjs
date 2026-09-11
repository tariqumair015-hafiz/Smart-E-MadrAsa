import fs from 'fs';
import path from 'path';

const coversDir = 'C:\\Users\\IQRA TRADERS\\Desktop\\covers';
const R2_PUBLIC_DOMAIN = 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/covers';

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[_\-\.\,\(\)\[\]\{\}\:\;\'\"\/\\\#\$\%\^\&\*\!\?\+]/g, ' ')
    .replace(/[\u064B-\u0652]/g, '') // remove arabic diacritics
    .replace(/\s+/g, ' ')
    .trim();
}

async function matchCovers() {
  console.log('==================================================');
  console.log('🔍 Smart Cover to Book Matching System');
  console.log('==================================================\n');

  const metadataPath = './books_metadata.json';
  const books = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  if (!fs.existsSync(coversDir)) {
    console.error('❌ Covers folder not found!');
    return;
  }

  const coverFiles = fs.readdirSync(coversDir).filter(f => /\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG)$/i.test(f));
  console.log(`📁 Found ${coverFiles.length} cover files to match against ${books.length} books.\n`);

  // Build index of covers by ID and normalized name
  const coverMapById = new Map();
  const coverList = [];

  for (const fileName of coverFiles) {
    const r2Url = `${R2_PUBLIC_DOMAIN}/${fileName}`;
    const cleanName = normalizeText(path.parse(fileName).name.replace(/^cover_/i, '').replace(/^user_/i, ''));

    // Extract all numbers in filename
    const numbers = fileName.match(/\d+/g) || [];
    for (const numStr of numbers) {
      const num = parseInt(numStr);
      if (!coverMapById.has(num)) coverMapById.set(num, r2Url);
    }

    coverList.push({ fileName, r2Url, cleanName });
  }

  let newlyMatched = 0;
  let alreadyMatched = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];

    // If already has working R2 cover, keep it
    if (book.cover_url && book.cover_url.includes('r2.dev')) {
      alreadyMatched++;
      continue;
    }

    let matchedUrl = null;

    // 1. Try matching by Book ID
    if (coverMapById.has(book.id)) {
      matchedUrl = coverMapById.get(book.id);
    }

    // 2. Try matching by Title normalization
    if (!matchedUrl && book.title) {
      const normTitle = normalizeText(book.title);
      for (const cov of coverList) {
        if (cov.cleanName.length >= 4 && (normTitle.includes(cov.cleanName) || cov.cleanName.includes(normTitle))) {
          matchedUrl = cov.r2Url;
          break;
        }
      }
    }

    // 3. Try word overlap matching
    if (!matchedUrl && book.title) {
      const normTitleWords = normalizeText(book.title).split(' ').filter(w => w.length > 3);
      let bestMatch = null;
      let maxScore = 0;

      for (const cov of coverList) {
        const covWords = cov.cleanName.split(' ').filter(w => w.length > 3);
        let score = 0;
        for (const w of covWords) {
          if (normTitleWords.includes(w)) score++;
        }
        if (score > maxScore && score >= 2) {
          maxScore = score;
          bestMatch = cov.r2Url;
        }
      }
      if (bestMatch) matchedUrl = bestMatch;
    }

    if (matchedUrl) {
      books[i].cover_url = matchedUrl;
      newlyMatched++;
      console.log(`🎯 [Match #${newlyMatched}] Book #${book.id} -> ${matchedUrl.split('/').pop()}`);
    }
  }

  // Write updated metadata
  fs.writeFileSync('./books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  if (fs.existsSync('./public/books_metadata.json')) {
    fs.writeFileSync('./public/books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  }

  const totalWithR2Cover = books.filter(b => b.cover_url && b.cover_url.includes('r2.dev')).length;

  console.log('\n==================================================');
  console.log(`🎉 MATCHING COMPLETE!`);
  console.log(` Already Matched R2 Covers: ${alreadyMatched}`);
  console.log(` Newly Matched Covers: ${newlyMatched}`);
  console.log(` Total Books now with R2 Cover: ${totalWithR2Cover} / ${books.length}`);
  console.log('==================================================\n');
}

matchCovers();
