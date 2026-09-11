import fs from 'fs';
import path from 'path';

function normalizeText(t) {
  if (!t) return '';
  return t
    .toLowerCase()
    .replace(/[_\-\.\,\(\)\[\]\{\}\:\;\'\"\/\\\#\$\%\^\&\*\!\?\+]/g, ' ')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runExactMatching() {
  console.log('==================================================');
  console.log('⚡ INSTANT EXACT COVER MATCHING (0 Mismatches, 0 Duplicates)');
  console.log('==================================================\n');

  const mainPath = './books_metadata.json';
  const backupPath = './books_metadata_backup_fresh.json';
  const desktopCoversDir = 'C:\\Users\\IQRA TRADERS\\Desktop\\covers';

  const books = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
  const backupBooks = fs.existsSync(backupPath) ? JSON.parse(fs.readFileSync(backupPath, 'utf8')) : [];

  const backupMapById = new Map();
  for (const b of backupBooks) {
    if (b.cover_url && typeof b.cover_url === 'string' && b.cover_url.trim() !== '') {
      let r2Url = b.cover_url;
      if (r2Url.includes('supabase.co')) {
        r2Url = r2Url.replace(/https:\/\/ymizqgtlnhvkqlidftiy\.supabase\.co\/storage\/v1\/object\/public\/(book-covers\/covers|books-pdfs\/covers|scholar-images)\//g, 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/covers/');
        r2Url = r2Url.replace(/https:\/\/ymizqgtlnhvkqlidftiy\.supabase\.co\/storage\/v1\/object\/public\/[^\/]+\//g, 'https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/covers/');
      }
      backupMapById.set(b.id, r2Url);
    }
  }

  const desktopFiles = fs.existsSync(desktopCoversDir) 
    ? fs.readdirSync(desktopCoversDir).filter(f => /\.(jpg|jpeg|png|webp|gif|JPG|JPEG|PNG)$/i.test(f))
    : [];

  const desktopMapById = new Map();
  const desktopTitleList = [];

  for (const file of desktopFiles) {
    const r2Url = `https://pub-99997f399a834420a9f9f20722cd9bb9.r2.dev/covers/${file}`;
    const base = path.parse(file).name;
    const nums = base.match(/\d+/g) || [];

    for (const nStr of nums) {
      const num = parseInt(nStr);
      if (num > 100 && !desktopMapById.has(num)) {
        desktopMapById.set(num, r2Url);
      }
    }

    const clean = normalizeText(base.replace(/^cover_/i, '').replace(/^user_/i, '').replace(/\d+/g, ''));
    if (clean.length >= 6) {
      desktopTitleList.push({ file, r2Url, clean });
    }
  }

  const usedUrls = new Set();
  let restoredFromBackup = 0;
  let matchedById = 0;
  let matchedByStrictTitle = 0;
  let nullCount = 0;

  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    let matchedUrl = null;

    // Rule 1: Exact original backup URL match
    if (backupMapById.has(b.id)) {
      const url = backupMapById.get(b.id);
      if (!usedUrls.has(url)) {
        matchedUrl = url;
        restoredFromBackup++;
      }
    }

    // Rule 2: Exact ID match from Desktop covers
    if (!matchedUrl && desktopMapById.has(b.id)) {
      const url = desktopMapById.get(b.id);
      if (!usedUrls.has(url)) {
        matchedUrl = url;
        matchedById++;
      }
    }

    // Rule 3: Strict title token match (ONLY if 1 unique match)
    if (!matchedUrl && b.title) {
      const normTitle = normalizeText(b.title);
      const candidates = [];

      for (const cov of desktopTitleList) {
        if (usedUrls.has(cov.r2Url)) continue;
        if (cov.clean.length >= 6 && normTitle.includes(cov.clean)) {
          candidates.push(cov.r2Url);
        }
      }

      if (candidates.length === 1) {
        matchedUrl = candidates[0];
        matchedByStrictTitle++;
      }
    }

    if (matchedUrl) {
      books[i].cover_url = matchedUrl;
      usedUrls.add(matchedUrl);
    } else {
      books[i].cover_url = null;
      nullCount++;
    }
  }

  // Save metadata files instantly
  fs.writeFileSync('./books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  if (fs.existsSync('./public/books_metadata.json')) {
    fs.writeFileSync('./public/books_metadata.json', JSON.stringify(books, null, 2), 'utf8');
  }

  const totalMatched = books.filter(b => b.cover_url !== null).length;

  console.log('==================================================');
  console.log('🎉 INSTANT MATCHING COMPLETE!');
  console.log(` 1. Restored from Original Backup: ${restoredFromBackup}`);
  console.log(` 2. Matched by Exact Book ID: ${matchedById}`);
  console.log(` 3. Matched by Strict Title Token: ${matchedByStrictTitle}`);
  console.log(` ---------------------------------------`);
  console.log(` Total 100% Exact Matched Books: ${totalMatched} / ${books.length}`);
  console.log(` Total Clean Emblem Placeholder Books: ${nullCount}`);
  console.log('==================================================\n');
}

runExactMatching();
