import fs from 'fs';

const books = JSON.parse(fs.readFileSync('books_metadata.json', 'utf8'));
console.log('Total books in books_metadata.json:', books.length);

const categories = {};
books.forEach(b => {
  const cat = b.category || 'Uncategorized';
  categories[cat] = (categories[cat] || 0) + 1;
});

console.log('Categories breakdown:');
console.log(categories);
