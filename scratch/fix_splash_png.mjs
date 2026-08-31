import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const resDir = 'g:/My Drive/Smart E Madarsa/android/app/src/main/res';

async function main() {
  console.log("Scanning resource directories...");
  const dirs = fs.readdirSync(resDir);
  let count = 0;
  
  for (const d of dirs) {
    const dPath = path.join(resDir, d);
    if (!fs.statSync(dPath).isDirectory()) continue;
    
    const p = path.join(dPath, 'splash.png');
    if (fs.existsSync(p)) {
      console.log(`Found: ${d}/splash.png`);
      const tempPath = p + '.tmp';
      
      try {
        // Read file and compile to true PNG
        await sharp(p)
          .png()
          .toFile(tempPath);
          
        // Overwrite original file
        fs.unlinkSync(p);
        fs.renameSync(tempPath, p);
        
        // Verify signature
        const buf = Buffer.alloc(8);
        const fd = fs.openSync(p, 'r');
        fs.readSync(fd, buf, 0, 8, 0);
        fs.closeSync(fd);
        const finalStat = fs.statSync(p);
        
        console.log(`  Fixed successfully! New size: ${finalStat.size} bytes, Hex signature: ${buf.toString('hex')}`);
        count++;
      } catch (err) {
        console.error(`  Error fixing ${d}/splash.png:`, err);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  }
  
  console.log(`Done! Fixed ${count} splash.png files.`);
}

main();
