import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

async function collectAllSaniaLinks() {
  const baseUrl = 'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/';
  const allLinks = new Set();
  const bookData = [];
  
  console.log('--- Collecting Book Links from 9 Pages (using Invoke-WebRequest) ---');
  
  for (let page = 1; page <= 9; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;
    const tempFile = path.join('tmp', `sania_page_${page}.html`);
    console.log(`Processing Page ${page}: ${url}`);
    
    try {
      // Use PowerShell Invoke-WebRequest
      execSync(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${tempFile}'"`, { stdio: 'inherit' });
      
      const html = readFileSync(tempFile, 'utf8');
      console.log(`  HTML Length: ${html.length}`);
      
      // Flexible regex
      const entryRegex = /class="entry-title"><a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/g;
      let match;
      let count = 0;
      
      while ((match = entryRegex.exec(html)) !== null) {
        const link = match[1];
        const title = match[2].replace(/<[^>]*>/g, '').trim();
        
        if (!allLinks.has(link)) {
          allLinks.add(link);
          bookData.push({ title, link });
          count++;
        }
      }
      console.log(`  Found ${count} unique books on page ${page}. (Total unique: ${allLinks.size})`);

    } catch (e) {
      console.error(`  Error on page ${page}:`, e.message);
    }
  }

  writeFileSync('tmp/sania_book_links.json', JSON.stringify(bookData, null, 2), 'utf8');
  console.log(`\nSUCCESS: Extracted ${bookData.length} unique book links.`);
}

collectAllSaniaLinks().catch(console.error);
