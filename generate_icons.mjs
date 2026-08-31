import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync('app_icon.svg');

const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
  for (const item of sizes) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', item.name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const outputPath = path.join(dir, 'ic_launcher.png');
    const outputPathRound = path.join(dir, 'ic_launcher_round.png');

    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);
    
    // For round icons, we can just use the same PNG since the SVG is circular anyway
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPathRound);

    console.log(`Generated ${item.name} icons (${item.size}x${item.size})`);
  }
  
  // Also update the drawable icon if it exists
  const drawableDir = path.join('android', 'app', 'src', 'main', 'res', 'drawable');
  if (fs.existsSync(drawableDir)) {
      await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(drawableDir, 'ic_launcher_background.png'));
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
