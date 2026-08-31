import fs from 'fs';
import path from 'path';

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

for (const file of files) {
  if (file.endsWith('.css')) {
    const content = fs.readFileSync(file, 'utf8');
    let openCount = 0;
    let closeCount = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') openCount++;
      if (content[i] === '}') closeCount++;
    }
    if (openCount !== closeCount) {
      console.log(`❌ Bracket mismatch in ${file}: { has ${openCount}, } has ${closeCount}`);
    } else {
      console.log(`✅ Brackets match in ${file}`);
    }
  }
}
