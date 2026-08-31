import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
    'https://ymizqgtlnhvkqlidftiy.supabase.co',
    'sb_secret_iwPiKZopox0LHO_fSaLzFw_8puMPGJD'
);

async function findOnArchive(title) {
    try {
        const cleanTitle = title
            .replace(/[\u0600-\u06FF]/g, '')
            .replace(/By\s+.*/i, '')
            .replace(/[^a-zA-Z0-9\s]/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 2)
            .slice(0, 4)
            .join(' ');

        if (!cleanTitle || cleanTitle.length < 3) return null;

        console.log(`  🔍 Searching: "${cleanTitle}"`);

        const res = await axios.get(
            `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(cleanTitle)})&mediatype=texts&output=json&rows=3&fl=identifier,title`,
            { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        const docs = res.data?.response?.docs;
        if (!docs || docs.length === 0) return null;

        console.log(`  📖 Found: ${docs[0].identifier}`);
        return `https://archive.org/services/img/${docs[0].identifier}`;

    } catch (e) {
        return null;
    }
}

async function uploadCover(bookId, imageUrl) {
    try {
        const res = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        const fileName = `covers/${bookId}.jpg`;
        const { error } = await supabase.storage
            .from('book-covers')
            .upload(fileName, res.data, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) return null;

        return `https://ymizqgtlnhvkqlidftiy.supabase.co/storage/v1/object/public/book-covers/${fileName}`;
    } catch (e) {
        return null;
    }
}

async function main() {
    const { data: books } = await supabase
        .from('Books')
        .select('id, title')
        .is('cover_url', null)
        .limit(10);

    console.log(`Testing ${books.length} books...`);

    let success = 0;
    let failed = 0;

    for (const book of books) {
        console.log(`\n📚 ${book.title}`);

        const coverUrl = await findOnArchive(book.title);

        if (!coverUrl) {
            console.log(`  ❌ Not found`);
            failed++;
            continue;
        }

        const newUrl = await uploadCover(book.id, coverUrl);

        if (newUrl) {
            await supabase.from('Books').update({ cover_url: newUrl }).eq('id', book.id);
            success++;
            console.log(`  ✅ Done!`);
        } else {
            failed++;
            console.log(`  ❌ Upload failed`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\nDone! ✅ ${success}, ❌ ${failed}`);
}

main();