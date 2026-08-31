import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const destDir = 'g:\\My Drive\\Smart E Madarsa\\scratch\\input_screenshots';
const files = fs.readdirSync(destDir).filter(f => f.startsWith('input_') && f.endsWith('.jpg'));

for (const file of files) {
  const filePath = path.join(destDir, file);
  const metadata = await sharp(filePath).metadata();
  console.log(`${file}: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
}
