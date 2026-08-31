import sharp from 'sharp';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const SOURCE_ICON = 'C:\\Users\\IQRA TRADERS\\.gemini\\antigravity-ide\\brain\\7b3e15ba-d50e-4561-b609-b44a3691a437\\smart_madarsa_app_icon_1781981136734.png';

const BASE = 'G:\\My Drive\\Smart E Madarsa';

// All icon targets: [output path, size]
const targets = [
  // Play Store / main 512px icons
  [`${BASE}\\playstore_icon_512.png`, 512],
  [`${BASE}\\android\\app\\ic_launcher-playstore.png`, 512],
  
  // Android mipmap icons (square - no round for now)
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-mdpi\\ic_launcher.png`, 48],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-mdpi\\ic_launcher_round.png`, 48],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-hdpi\\ic_launcher.png`, 72],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-hdpi\\ic_launcher_round.png`, 72],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xhdpi\\ic_launcher.png`, 96],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xhdpi\\ic_launcher_round.png`, 96],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xxhdpi\\ic_launcher.png`, 144],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xxhdpi\\ic_launcher_round.png`, 144],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xxxhdpi\\ic_launcher.png`, 192],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xxxhdpi\\ic_launcher_round.png`, 192],

  // Android foreground (larger, for adaptive icon)
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-mdpi\\ic_launcher_foreground.png`, 108],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-hdpi\\ic_launcher_foreground.png`, 162],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xhdpi\\ic_launcher_foreground.png`, 216],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xxhdpi\\ic_launcher_foreground.png`, 324],
  [`${BASE}\\android\\app\\src\\main\\res\\mipmap-xxxhdpi\\ic_launcher_foreground.png`, 432],
  [`${BASE}\\android\\app\\src\\main\\res\\drawable\\ic_launcher_foreground.png`, 432],

  // iOS
  [`${BASE}\\ios\\App\\App\\Assets.xcassets\\AppIcon.appiconset\\AppIcon-512@2x.png`, 1024],
];

async function resizeIcon(src, dest, size) {
  try {
    await sharp(src)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(dest);
    console.log(`✅ ${size}px -> ${path.basename(dest)}`);
  } catch (err) {
    console.error(`❌ Failed ${dest}: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Replacing all app icons...\n');
  
  for (const [dest, size] of targets) {
    await resizeIcon(SOURCE_ICON, dest, size);
  }

  // Also copy to public folder as favicon equivalent
  try {
    await sharp(SOURCE_ICON)
      .resize(512, 512)
      .png()
      .toFile(`${BASE}\\public\\app_icon.png`);
    console.log('✅ public/app_icon.png created');
  } catch(e) {
    console.error('❌ public/app_icon.png failed:', e.message);
  }

  console.log('\n✅ All icons replaced successfully!');
}

main().catch(console.error);
