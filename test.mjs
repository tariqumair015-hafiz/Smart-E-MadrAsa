import fs from 'fs';
const html = fs.readFileSync('tmp_yusuf.html', 'utf8');
const titles = [...html.matchAll(/<h2 class="entry-title(?:[^>]*)><a href="([^"]+)">([^<]+)<\/a><\/h2>/g)].map(m => ({url: m[1], title: m[2]}));
console.log('Titles found:', titles.length);
console.log(titles.slice(0, 5));
