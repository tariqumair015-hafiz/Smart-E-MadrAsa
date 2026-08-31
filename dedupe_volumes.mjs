import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanVolumes() {
    console.log("Fetching Daura Hadith books to clean up repeated volumes...");
    const { data: books, error } = await supabase.from('Books').select('id, title, description').eq('category', 'دورہ حدیث');
    if (error) { console.error(error); return; }

    for(const book of books) {
        if(!book.description) continue;
        try {
            const rawVols = JSON.parse(book.description);
            if(!Array.isArray(rawVols) || rawVols.length === 0) continue;
            
            const cleanVols = [];
            const seenNumbers = new Set();
            
            for(const vol of rawVols) {
               // Ignore online reading links
               if (vol.title.toLowerCase().includes('read') || vol.title.includes('آن لائن')) continue;
               
               // Extract "Vol X"
               let numMatch = vol.title.match(/Vol(?:ume)?\s*0?(\d+)/i);
               if (numMatch) {
                   const n = parseInt(numMatch[1], 10);
                   // if we already have this volume number, skip it!
                   // wait, what if it's "Vol 1" but there's a different book entirely?
                   // no, these are all repetitions of the same book!
                   if (!seenNumbers.has(n)) {
                       seenNumbers.add(n);
                       cleanVols.push(vol);
                   }
               } else {
                   // What if it just says "Link 1"? If we already have a Link 1, skip duplicate titles
                   if (!cleanVols.find(v => v.title === vol.title)) {
                       cleanVols.push(vol);
                   }
               }
            }
            
            // if cleanVols got completely emptied (e.g. they ALL didn't have numbers), fallback to first half?
            // Fallback: just use unique `title` properties. But the titles have file sizes e.g. "Vol 01(38MB)".
            
            const simplifiedVols = cleanVols.map((v, idx) => {
                 let t = v.title;
                 let numMatch = t.match(/Vol(?:ume)?\s*0?(\d+)/i);
                 if (numMatch) {
                    return { title: `Volume ${numMatch[1]}`, url: v.url };
                 } else if (t.includes('Link')) {
                    return { title: `Volume ${idx+1}`, url: v.url };
                 }
                 return v;
            });

            // Sort by volume number if possible
            simplifiedVols.sort((a,b) => {
                let m1 = a.title.match(/\d+/);
                let m2 = b.title.match(/\d+/);
                if(m1 && m2) return parseInt(m1[0]) - parseInt(m2[0]);
                return 0;
            });

            if (rawVols.length > simplifiedVols.length) {
                console.log(`Cleaning ${book.title}: from ${rawVols.length} -> to ${simplifiedVols.length} distinct volumes.`);
                await supabase.from('Books').update({ description: JSON.stringify(simplifiedVols) }).eq('id', book.id);
            }
        } catch(e) { console.error("Parse error for", book.title); }
    }
    console.log("Done cleaning volumes!");
}
cleanVolumes();
