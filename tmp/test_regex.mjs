import { readFileSync } from 'fs';

const html = readFileSync('tmp/sania_page_1.html', 'utf8');
const entryRegex = /entry-title.*?href="([^"]*)".*?>(.*?)<\/a>/g;
let match;
let count = 0;

console.log('--- Testing Regex on sania_page_1.html ---');
while ((match = entryRegex.exec(html)) !== null) {
  console.log(`Match: ${match[1]} | Title: ${match[2].trim()}`);
  count++;
}
console.log(`Total Found: ${count}`);
