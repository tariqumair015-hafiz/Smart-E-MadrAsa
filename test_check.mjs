import fs from 'fs';

try {
  const b = fs.readFileSync('salesa_final_books.json','utf-8');
  const books = JSON.parse(b);
  const textbooks = books.filter(x => x.sub_category === 'درسی کتب');
  console.log('Textbooks:', textbooks.length);
  textbooks.forEach(x => console.log(' - ' + x.title));
  
  console.log('\nOther books:');
  books.filter(x => x.sub_category !== 'درسی کتب').forEach(x => console.log(` - [${x.sub_category}] ${x.title.substring(0, 40)}`));
} catch(e) {
  console.log(e.message);
}
