import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const targetTitles = [
    "کتاب ابو داؤد",
    "کتاب شمائل ترمذی",
    "کتاب بخاری شریف",
    "کتاب صحیح مسلم",
    "Dars e Falkiyat",
    "درس فلکیات",
    "Badr un Nujoom",
    "بدر النجوم",
    "Bahrul Uloom",
    "بحرالعلوم",
    "Zia un Nujoom",
    "ضیاء النجوم",
    "Masdar Us Sudoor",
    "Majmooa e Mantiq",
    "مجموعہ منطق",
    "Al Tahreer ul Misalia",
    "التحریر المثالیہ",
    "Qazi Mubarak",
    "القاضی",
    "Ashraf ul Marzi",
    "اشرف المرضی"
];

async function updateAndReport() {
    let log = "Finding target books...\n";
    const idsToUpdate = [];
    
    for (const title of targetTitles) {
        const { data, error } = await supabase
            .from('Books')
            .select('id, title')
            .ilike('title', `%${title}%`);
        if (data) data.forEach(b => {
            log += `Found: [${b.id}] ${b.title}\n`;
            idsToUpdate.push(b.id);
        });
    }

    if (idsToUpdate.length > 0) {
        const uniqueIds = [...new Set(idsToUpdate)];
        log += `Updating ${uniqueIds.length} books to set cover_url to null...\n`;
        await supabase.from('Books').update({ cover_url: null }).in('id', uniqueIds);
        log += "Update completed.\n";
    }

    log += "\nGenerating final list of books with NULL covers...\n";
    const { data: missingBooks } = await supabase
        .from('Books')
        .select('id, title, author, sub_category')
        .is('cover_url', null);
        
    if (missingBooks) {
        log += `--- Total Books with Missing Covers: ${missingBooks.length} ---\n`;
        missingBooks.forEach((b, i) => {
            log += `${i+1}. [ID: ${b.id}] ${b.title} (${b.author || 'No Author'}) [Cat: ${b.sub_category}]\n`;
        });
    }

    fs.writeFileSync('missing_covers_report.txt', log, 'utf8');
}

updateAndReport();
