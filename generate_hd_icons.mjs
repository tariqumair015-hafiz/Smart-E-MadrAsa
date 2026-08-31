import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync('app_icon.svg');

// Legacy icon sizes
const legacySizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

// Adaptive icon sizes (108dp)
const adaptiveSizes = [
  { name: 'mipmap-mdpi', size: 108 },
  { name: 'mipmap-hdpi', size: 162 },
  { name: 'mipmap-xhdpi', size: 216 },
  { name: 'mipmap-xxhdpi', size: 324 },
  { name: 'mipmap-xxxhdpi', size: 432 }
];

async function generateIcons() {
  console.log('Generating True HD Icons from SVG...');

  // 1. Generate Legacy Icons
  for (const item of legacySizes) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', item.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const outputPath = path.join(dir, 'ic_launcher.png');
    const outputPathRound = path.join(dir, 'ic_launcher_round.png');

    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);

    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPathRound);

    console.log(`Generated Legacy ${item.name} (${item.size}x${item.size})`);
  }

  // 2. Generate Adaptive Icons (Foreground)
  for (const item of adaptiveSizes) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', item.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const outputForeground = path.join(dir, 'ic_launcher_foreground.png');
    const outputBackground = path.join(dir, 'ic_launcher_background.png');

    // The foreground in adaptive icons is scaled down by Android (the safe zone is diameter 66dp out of 108dp).
    // The SVG likely fills its entire viewbox. To prevent clipping in adaptive icons,
    // we should resize the logo slightly smaller inside the canvas, OR just let it be if it already has padding.
    // Assuming app_icon.svg has its own correct padding, we'll just render it at the adaptive size.
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(outputForeground);

    // Create a plain white/colored background, or simply reuse the icon if the icon has a background.
    // If the SVG has no background (transparent), we can create a solid background.
    // We'll create a simple solid white background for adaptive.
    await sharp({
      create: {
        width: item.size,
        height: item.size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toFile(outputBackground);

    console.log(`Generated Adaptive ${item.name} (${item.size}x${item.size})`);
  }

  // 3. Update Playstore High Res icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('playstore_icon_512.png');
    
  console.log('HD Icons Generation Complete!');
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
