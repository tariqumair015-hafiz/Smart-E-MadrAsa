import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('./src/AIChat.css', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('btn') || line.toLowerCase().includes('floating') || line.toLowerCase().includes('button')) {
    console.log(`AIChat.css:${idx + 1}: ${line.trim()}`);
  }
});
