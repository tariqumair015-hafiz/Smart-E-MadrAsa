import fs from 'fs';

const html = fs.readFileSync('tmp_sania_p1.html', 'utf8');
console.log('File size:', html.length);

// Look for book links
const linkRegex = /href="(https:\/\/besturdubooks\.net\/[^"]+)"/g;
const links = [];
let m;
while ((m = linkRegex.exec(html)) !== null) {
  const url = m[1];
  if (!url.includes('/category/') && !url.includes('/tag/') && !url.includes('/page/') && !url.includes('/author/') && !url.includes('?') && url !== 'https://besturdubooks.net/') {
    links.push(url);
  }
}
const uniqueLinks = [...new Set(links)];
console.log('Unique book links found:', uniqueLinks.length);
uniqueLinks.slice(0, 15).forEach(l => console.log(' ', l));

// Check article tags
const articleCount = (html.match(/<article/g) || []).length;
console.log('\nArticle tags:', articleCount);

// Check for h2, h3, h4
const h2Count = (html.match(/<h2/g) || []).length;
const h3Count = (html.match(/<h3/g) || []).length; 
const h4Count = (html.match(/<h4/g) || []).length;
console.log('h2:', h2Count, 'h3:', h3Count, 'h4:', h4Count);

// Find the first entry with title class
const titleIdx = html.indexOf('class="wp-block-post-title');
console.log('\nwp-block-post-title index:', titleIdx);
if (titleIdx > 0) {
  console.log(html.substring(titleIdx - 50, titleIdx + 400));
}

// Find any anchor with article-like classes
const postTitleIdx = html.indexOf('entry-title');
console.log('\nentry-title index:', postTitleIdx);
if (postTitleIdx > 0) {
  console.log(html.substring(postTitleIdx - 100, postTitleIdx + 400));
}
