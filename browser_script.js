async function scrapeAll() {
  const books = [];
  
  for (let page = 1; page <= 6; page++) {
    const url = page === 1 
      ? 'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/' 
      : `https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-urdu-shuroohat/page/${page}/`;
    
    console.log("Fetching page " + page);
    let res;
    try {
        res = await fetch(url);
    } catch(e) {
        console.error("Failed to fetch", url);
        continue;
    }
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const content = doc.querySelector('.entry-content') || doc.querySelector('.post-content');
    if (!content) continue;
    
    const images = Array.from(content.querySelectorAll('img'));
    
    for (let img of images) {
      let coverUrl = img.getAttribute('data-lazy-src') || img.getAttribute('data-src') || img.getAttribute('data-orig-src') || img.getAttribute('src') || '';
      if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder') || coverUrl.includes('icon') || coverUrl.length < 20) continue;
      
      if (coverUrl.includes('wp.com')) {
          coverUrl = coverUrl.replace(/https?:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
      } else if (coverUrl.includes('?')) {
          coverUrl = coverUrl.split('?')[0];
      }
      
      let title = img.getAttribute('alt') || img.getAttribute('title') || '';
      title = title.replace(/Download Link \d+/gi, '').replace(/Download/gi, '').replace(/\[.*?\]/g, '').replace(/^\d+\.\s*/, '').trim();
      
      if (!title || title.length < 3) {
        let prev = img.parentElement.previousElementSibling;
        let searchLimit = 0;
        while (prev && (!title || title.length < 3) && searchLimit < 10) {
          const text = prev.textContent.trim();
          if (text && text.length > 4 && 
              !text.toLowerCase().includes('click here') && 
              !text.toLowerCase().includes('download link') && 
              !text.toLowerCase().includes('nisab') &&
              !text.match(/^\d+\.$/) &&
              !text.match(/^(volume|vol|part)\s*\d+$/i)) {
            title = text;
          }
          prev = prev.previousElementSibling;
          searchLimit++;
        }
      }
      
      const volumes = [];
      let scan = img.closest('.entry-content > *');
      if (!scan) scan = img.parentElement;
      
      let limit = 0;
      let isLink2 = false;
      
      const processAnchor = (a) => {
        if (isLink2) return;
        const href = a.getAttribute('href') || '';
        let text = a.textContent.trim();
        
        if (href && (href.includes('archive.org/download') || href.includes('archive.org/details') || href.includes('mediafire.com'))) {
          let volTitle = text || `Volume ${volumes.length + 1}`;
          if (volTitle.toLowerCase() === 'download' || volTitle.toLowerCase().includes('click here') || volTitle.toLowerCase().includes('link 1')) {
             volTitle = `Volume ${volumes.length + 1}`;
          }
          let downloadUrl = href;
          if (href.includes('archive.org/details/')) downloadUrl = href.replace('/details/', '/download/');
          
          if (!volumes.find(v => v.url === downloadUrl)) {
            volumes.push({ title: volTitle, url: downloadUrl });
          }
        }
      };
      
      // Links in same node
      Array.from(scan.querySelectorAll('a')).forEach(processAnchor);
      
      // Next siblings
      while (scan && limit < 25) {
        scan = scan.nextElementSibling;
        if (!scan || scan.querySelector('img')) break;
        
        const textContent = scan.textContent.toLowerCase();
        if (textContent.includes('link 2') || textContent.includes('read online') || textContent.includes('link 02')) {
           isLink2 = true;
        }
        
        if (!isLink2) {
           Array.from(scan.querySelectorAll('a')).forEach(processAnchor);
        }
        limit++;
      }
      
      if (title && volumes.length > 0) {
        books.push({
          title,
          cover_url: coverUrl,
          volumes,
          pdf_url: volumes[0].url
        });
      }
    }
  }
  
  // Unique
  const uniqueBooks = [];
  for (let b of books) {
     if (!uniqueBooks.find(u => u.pdf_url === b.pdf_url)) uniqueBooks.push(b);
  }
  return JSON.stringify(uniqueBooks, null, 2);
}

// Attach to window so we can easily get it
window.scrapeResult = "running...";
scrapeAll().then(res => { window.scrapeResult = res; }).catch(e => { window.scrapeResult = "ERROR: " + e; });
