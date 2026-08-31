import fs from 'fs';
const content = fs.readFileSync('tmp/scrape_encyclopedia.js', 'utf8');
const search = 'دائرۃ المعارف';
const find = content.indexOf(search);
if (find > 0) {
  const segment = content.substring(find, find + search.length);
  console.log(`String: ${segment}`);
  for (let i = 0; i < segment.length; i++) {
    console.log(`${segment[i]} : ${segment.charCodeAt(i).toString(16)}`);
  }
} else {
  console.log('Not found');
}
process.exit(0);
