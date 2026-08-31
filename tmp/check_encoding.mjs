import { readFileSync } from 'fs';

const buffer = readFileSync('tmp/sania_page_1.html');
console.log('--- Encoding Check ---');
console.log('First 10 bytes:', buffer.slice(0, 10));

// Check for UTF-16 BOM (Little Endian: FF FE, Big Endian: FE FF)
let html = '';
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
  console.log('Detected UTF-16 LE');
  html = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
  console.log('Detected UTF-16 BE');
  html = buffer.slice(2).swap16().toString('utf16le');
} else {
  console.log('Assuming UTF-8 or similar');
  html = buffer.toString('utf8');
}

console.log('HTML Length after conversion:', html.length);
const entryRegex = /entry-title.*?href="([^"]*)".*?>(.*?)<\/a>/g;
let match;
let count = 0;

while ((match = entryRegex.exec(html)) !== null) {
  console.log(`Match: ${match[1]} | Title: ${match[2].trim()}`);
  count++;
}
console.log(`Total Found: ${count}`);
