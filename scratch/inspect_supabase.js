import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- SUPABASE STORAGE BUCKETS ---');
    const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
    if (bucketsErr) {
        console.error('Error listing buckets:', bucketsErr);
    } else {
        console.log('Buckets found:', buckets.map(b => b.name));
        for (const bucket of buckets) {
            console.log(`\nBucket [${bucket.name}] files:`);
            const { data: files, error: filesErr } = await supabase.storage.from(bucket.name).list('', { limit: 1000 });
            if (filesErr) console.error(`Error listing ${bucket.name}:`, filesErr);
            else {
                console.log(`Found ${files.length} items in root of ${bucket.name}`);
                files.slice(0, 10).forEach(f => console.log(' -', f.name, f.metadata?.size || ''));
            }
        }
    }

    console.log('\n--- SUPABASE BOOKS TABLE ---');
    const { data: books, error: booksErr } = await supabase.from('Books').select('*');
    if (booksErr) {
        console.error('Error fetching Books:', booksErr);
    } else {
        console.log(`Total rows in Books table: ${books.length}`);
        if (books.length > 0) {
            console.log('Sample book columns:', Object.keys(books[0]));
            
            // Check cover_url patterns
            const coversWithSupabase = books.filter(b => b.cover_url && b.cover_url.includes('supabase'));
            const coversWithCloudflare = books.filter(b => b.cover_url && b.cover_url.includes('r2.dev'));
            const coversNull = books.filter(b => !b.cover_url);
            const coversOther = books.filter(b => b.cover_url && !b.cover_url.includes('supabase') && !b.cover_url.includes('r2.dev'));
            
            console.log('\nCover URLs stats:');
            console.log(' - Supabase URLs:', coversWithSupabase.length);
            console.log(' - Cloudflare R2 URLs:', coversWithCloudflare.length);
            console.log(' - Null/Empty:', coversNull.length);
            console.log(' - Other external URLs:', coversOther.length);
            
            // Check pdf/text/file URLs if any
            const pdfKeys = Object.keys(books[0]).filter(k => k.toLowerCase().includes('pdf') || k.toLowerCase().includes('url') || k.toLowerCase().includes('file') || k.toLowerCase().includes('link'));
            console.log('\nURL related fields:', pdfKeys);
            pdfKeys.forEach(key => {
                const spCount = books.filter(b => b[key] && typeof b[key] === 'string' && b[key].includes('supabase')).length;
                const cfCount = books.filter(b => b[key] && typeof b[key] === 'string' && b[key].includes('r2.dev')).length;
                const extCount = books.filter(b => b[key] && typeof b[key] === 'string' && !b[key].includes('supabase') && !b[key].includes('r2.dev')).length;
                console.log(`Field [${key}]: Supabase=${spCount}, Cloudflare=${cfCount}, External/Other=${extCount}`);
            });
        }
    }
}

inspect().catch(console.error);
