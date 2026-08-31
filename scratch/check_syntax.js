import fs from 'fs';
import path from 'path';
import { parse } from 'acorn';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && f !== 'node_modules' && f !== '.git' && f !== 'dist') {
      walkDir(dirPath, callback);
    } else if (!isDirectory && (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json') || f.endsWith('.css'))) {
      callback(dirPath);
    }
  });
}

const root = '.';
walkDir(root, (filePath) => {
  if (filePath.endsWith('.json')) {
    try {
      JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.log(`JSON error in ${filePath}:`, e.message);
    }
    return;
  }
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      // basic test using acorn (it doesn't support jsx by default, but we can do a simple syntax check using esbuild or babel if installed, or just check for bad characters/encoding)
      // Let's check for weird characters like null bytes or control characters
      if (code.includes('\u0000')) {
        console.log(`Null byte found in ${filePath}`);
      }
    } catch (e) {
      console.log(`Read error in ${filePath}:`, e.message);
    }
  }
});
console.log('Syntax scan done.');
