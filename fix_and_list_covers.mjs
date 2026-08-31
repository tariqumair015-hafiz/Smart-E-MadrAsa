import { createClient } from '@supabase/supabase-js';

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
    console.log("Finding target books...");
    const idsToUpdate = [];
    
    // Partial title matching
    for (const title of targetTitles) {
        const { data, error } = await supabase
            .from('Books')
            .select('id, title')
            .ilike('title', `%${title}%`);
            
        if (error) {
            console.error(`Error searching for ${title}:`, error.message);
            continue;
        }
        
        data.forEach(b => {
            console.log(`Found: [${b.id}] ${b.title}`);
            idsToUpdate.push(b.id);
        });
    }

    if (idsToUpdate.length === 0) {
        console.log("No books found matching the titles.");
    } else {
        const uniqueIds = [...new Set(idsToUpdate)];
        console.log(`Updating ${uniqueIds.length} books to set cover_url to null...`);
        
        const { error: updateError } = await supabase
            .from('Books')
            .update({ cover_url: null })
            .in('id', uniqueIds);
            
        if (updateError) {
            console.error("Update failed:", updateError.message);
        } else {
            console.log("Update successful.");
        }
    }

    console.log("\nGenerating final list of books with NULL covers...");
    const { data: missingBooks, error: fetchError } = await supabase
        .from('Books')
        .select('id, title, author, sub_category')
        .is('cover_url', null);
        
    if (fetchError) {
        console.error("Fetch failed:", fetchError.message);
        return;
    }

    console.log(`--- Total Books with Missing Covers: ${missingBooks.length} ---`);
    missingBooks.forEach((b, i) => {
        console.log(`${i+1}. [ID: ${b.id}] ${b.title} (${b.author || 'No Author'}) [Cat: ${b.sub_category}]`);
    });
}

updateAndReport();
