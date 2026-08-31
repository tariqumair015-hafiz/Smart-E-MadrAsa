import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const srcDir = 'g:\\My Drive\\Smart E Madarsa\\src';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(srcDir);
console.log(`Checking ${files.length} files...`);

for (const file of files) {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    try {
      // We can check if it parses, but node --check might not support JSX syntax out-of-the-box
      // So let's run a quick dry run of esbuild or vite or just check if there's any obvious syntax errors
      // Wait, let's just use typescript or babel or esbuild if installed? No, we can just compile it or read it.
    } catch (e) {
      console.error(`Error in ${file}:`, e.message);
    }
  }
}
