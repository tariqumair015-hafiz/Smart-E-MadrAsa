import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Source: the new takhti icon PNG
const sourceIcon = 'C:/Users/ut304/.gemini/antigravity/brain/fb348cf9-bf94-489f-9d44-8b14ae45ef6d/smart_e_madarsa_icon_1777555097045.png';

const sizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
  console.log('🎨 Generating Android launcher icons from new takhti design...\n');

  for (const item of sizes) {
    const dir = path.join('android', 'app', 'src', 'main', 'res', item.name);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const outputPath = path.join(dir, 'ic_launcher.png');
    const outputPathRound = path.join(dir, 'ic_launcher_round.png');
    const outputForeground = path.join(dir, 'ic_launcher_foreground.png');

    // Square icon
    await sharp(sourceIcon)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPath);

    // Round icon (same image, Android handles the circular mask)
    await sharp(sourceIcon)
      .resize(item.size, item.size)
      .png()
      .toFile(outputPathRound);

    // Foreground for adaptive icons
    await sharp(sourceIcon)
      .resize(item.size, item.size)
      .png()
      .toFile(outputForeground);

    console.log(`  ✅ ${item.name} → ${item.size}x${item.size}px`);
  }

  // Drawable directory icons
  const drawableDir = path.join('android', 'app', 'src', 'main', 'res', 'drawable');
  if (!fs.existsSync(drawableDir)) {
    fs.mkdirSync(drawableDir, { recursive: true });
  }
  await sharp(sourceIcon).resize(512, 512).png().toFile(path.join(drawableDir, 'ic_launcher_background.png'));
  await sharp(sourceIcon).resize(512, 512).png().toFile(path.join(drawableDir, 'ic_launcher_foreground.png'));
  console.log('  ✅ drawable → 512x512px');

  // Play Store icon (512x512)
  const playStoreOutput = path.join('android', 'app', 'src', 'main', 'ic_launcher-playstore.png');
  await sharp(sourceIcon).resize(512, 512).png().toFile(playStoreOutput);
  console.log('  ✅ Play Store icon → 512x512px');

  // Also copy a 1024x1024 version for Play Store console upload
  const playStoreHiRes = 'playstore_icon_512.png';
  await sharp(sourceIcon).resize(512, 512).png().toFile(playStoreHiRes);
  console.log(`  ✅ Play Store Hi-Res → playstore_icon_512.png (root folder)`);

  console.log('\n🎉 All icons generated successfully!');
  console.log('📱 Run: npm run build && npx cap sync android && cd android && gradlew assembleDebug');
}

generateIcons().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
