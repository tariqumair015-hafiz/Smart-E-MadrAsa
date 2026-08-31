import fs from 'fs';

const content = fs.readFileSync('./src/AIChatPage.jsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Floating') || line.includes('AIButton') || line.includes('floating') || line.includes('btn') || line.includes('button')) {
    console.log(`AIChatPage.jsx:${idx + 1}: ${line.trim()}`);
  }
});
