import fs from 'fs';
import path from 'path';

function searchInFile(filePath, query) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes(query)) {
        console.log(`${path.basename(filePath)}:${idx + 1}: ${line.trim()}`);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

function walkDir(dir, query) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, query);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
      searchInFile(fullPath, query);
    }
  });
}

walkDir('./src', 'کتاب سرچ موڈ فعال');
walkDir('./src', 'search mode active');
