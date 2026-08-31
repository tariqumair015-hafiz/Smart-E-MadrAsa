import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchCover(query) {
    const url = 'https://besturdubooks.net/?s=' + encodeURIComponent(query);
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        const img = $('.hentry img').first();
        let src = img.attr('data-lazy-src') || img.attr('src') || '';
        if (src.includes('placeholder')) {
             src = img.attr('data-orig-src') || '';
        }
        if (src.includes('i2.wp.com')) src = src.replace(/https:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
        return src;
    } catch(e) { return null; }
}

async function fix() {
    const targets = [
        { q: 'التوضیح والمطول مکمل', dbQuery: 'Tauzeeh' },
        { q: 'شرح العقائد النسفیہ المکتبۃ البشری', dbQuery: 'Sharh Aqaid' },
        { q: 'علماء دیوبند کا دینی رخ مکتبہ لدھیانوی', dbQuery: 'Deoband' },
        { q: 'درس فلکیات مکتبۃ البشری', dbQuery: 'Falkiyat' },
        { q: 'کتاب الآثار امام محمد المکتبۃ البشری', dbQuery: 'Kitab ul Aasar' },
        { q: 'الفوز الکبیر فی اصول التفسیر المکتبۃ البشری', dbQuery: 'Fauz ul Kabeer' },
        { q: 'تفسیر جلالین المکتبۃ البشری', dbQuery: 'Jalalain' },
        { q: 'السراجی فی المیراث المکتبۃ البشری', dbQuery: 'Siraji' }
    ];

    for (const t of targets) {
        console.log(`Searching for: ${t.q}`);
        const cover = await searchCover(t.q);
        if (cover) {
            console.log(`Found: ${cover}`);
            const { error } = await supabase.from('Books').update({ cover_url: cover })
                .ilike('title', `%${t.dbQuery}%`)
                .eq('category', 'درجہ سادسہ')
                .eq('sub_category', 'درسی کتب');
            if (error) console.log(`DB Error on ${t.dbQuery}: ${error.message}`);
        } else {
            console.log(`Not found: ${t.q}`);
        }
    }
}

fix();
