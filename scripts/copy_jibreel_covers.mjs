import fs from 'fs';
import path from 'path';

const thumbnailsDir = 'D:\\jibreel\\MaktabaJibreel V2.8 (22-03-2018)\\Thumbnails';
const outputCoversDir = path.resolve('public/covers');
const metadataPath = path.resolve('books_metadata.json');

if (!fs.existsSync(outputCoversDir)) {
  fs.mkdirSync(outputCoversDir, { recursive: true });
}

console.log('🖼️ Starting Maktaba Jibreel Thumbnail Cover Importer...');

let copiedCount = 0;

if (fs.existsSync(thumbnailsDir)) {
  const files = fs.readdirSync(thumbnailsDir);
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      const baseId = path.basename(file, ext);
      const srcFile = path.join(thumbnailsDir, file);
      const destFile = path.join(outputCoversDir, `cover_${baseId}.jpg`);
      
      try {
        fs.copyFileSync(srcFile, destFile);
        copiedCount++;
      } catch (err) {
        // ignore copy errors
      }
    }
  });
  console.log(`✅ Copied ${copiedCount} authentic Maktaba Jibreel cover thumbnails to public/covers/!`);
} else {
  console.log('⚠️ Thumbnails directory not found at', thumbnailsDir);
}
