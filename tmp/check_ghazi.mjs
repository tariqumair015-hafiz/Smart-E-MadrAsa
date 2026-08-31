import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // Let's get the DB items first
    const {data} = await supabase.from('Books').select('id, title, cover_url').eq('sub_category', 'dr-mahmood-ahmad-ghazi');
    
    // We already have their URLs by converting titles or using known slugs, e.g.
    const url = 'https://besturdubooks.net/muhazarat-e-taleem/';
    console.log("Fetching ", url);
    const { data: pageData } = await axios.get(url);
    const $ = cheerio.load(pageData);
    
    $('img').each((i, e) => {
       const src = $(e).attr('src') || $(e).attr('data-src');
       if (src && src.includes('wp-content')) {
           console.log("Image found: ", src);
       }
    });

    console.log("Done checking images.");
})();
