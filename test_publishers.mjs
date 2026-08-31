import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    const res = await axios.get('https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-text-books/');
    const $ = cheerio.load(res.data);
    const content = $('.entry-content');
    
    // Just dump the text and children of the first image's parent and following siblings
    const img = content.find('img').first();
    let current = img.parent();
    if(current[0].name !== 'p' && current[0].name !== 'figure') current = img; // find right level
    
    console.log("Found Image:", img.attr('src'));
    
    // go backwards for title
    let prev = current.prev();
    for(let i=0; i<3; i++) {
        if(prev.length) {
            console.log("Prev:", prev[0].name, prev.text().trim().substring(0, 50));
            prev = prev.prev();
        }
    }
    
    // go forwards for links and publishers
    let next = current.next();
    for(let i=0; i<30; i++) {
        if(next.length) {
            const isImg = next.find('img').length > 0;
            if(isImg) {
                console.log("-> STOP: Found next image");
                break;
            }
            console.log("Next:", next[0].name, next.text().trim().substring(0, 50));
            const links = next.find('a');
            if(links.length > 0) {
                console.log("   Links:", links.length);
            }
            next = next.next();
        }
    }
}
test();
