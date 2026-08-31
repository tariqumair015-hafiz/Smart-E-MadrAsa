import { readFileSync } from 'fs';

const html = readFileSync('tmp/sania_page_1.html', 'utf8');
console.log('--- Diagnosis ---');
console.log('Total HTML Length:', html.length);

const index = html.indexOf('entry-title');
if (index === -1) {
  console.log('ERROR: "entry-title" NOT FOUND in the string!');
  // Let's see some part of the middle
  console.log('Snippet from middle:', html.substring(html.length / 2, html.length / 2 + 500));
} else {
  console.log('FOUND "entry-title" at index:', index);
  console.log('Snippet:', html.substring(index - 20, index + 300));
  
  // Try a very basic regex
  const simpleMatch = html.match(/class="entry-title">.*?<\/h2>/);
  console.log('Simple Match:', simpleMatch ? simpleMatch[0] : 'None');
}
