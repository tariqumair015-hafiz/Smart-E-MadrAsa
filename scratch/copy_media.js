import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\IQRA TRADERS\\.gemini\\antigravity-ide\\brain\\3e26afa8-cb92-444e-9012-cfced78675c9';
const destDir = 'g:\\My Drive\\Smart E Madarsa\\scratch\\input_screenshots';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(brainDir).filter(f => f.startsWith('media__') && f.endsWith('.jpg'));
console.log('Found media files:', files);

files.forEach((file, index) => {
  const src = path.join(brainDir, file);
  const dest = path.join(destDir, `input_${index + 1}.jpg`);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file} -> input_${index + 1}.jpg`);
});
