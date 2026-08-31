import axios from 'axios';
import * as cheerio from 'cheerio';

async function testOthers() {
  const cats = [
    { name: 'Textbooks', url: 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/' },
    { name: 'Arabic', url: 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-arabic-shuroohat/' }
  ];
  for (const cat of cats) {
    for (let i = 1; i <= 3; i++) {
      const url = i === 1 ? cat.url : `${cat.url}${i}/`;
      try {
        const { status } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`${cat.name} Page ${i}: Status ${status}`);
      } catch (err) {
        console.log(`${cat.name} Page ${i}: Error: ${err.message}`);
      }
    }
  }
}
testOthers();
