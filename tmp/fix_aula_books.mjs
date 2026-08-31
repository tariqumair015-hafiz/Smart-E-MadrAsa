import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ═══════════════════════════════════════════════════════════════
// PART 1: Fix 22 corrupted books (clean titles + covers)
// ═══════════════════════════════════════════════════════════════

const FIXES = [
  {
    id: 19283,
    title: 'Noor ul Izah نور الایضاح و نجاۃ الارواح مکتبۃ کنوز العلم',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/NOOR-UL-AIZAH-O-NAJAT-UL-ARWAH-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19284,
    title: 'Noor ul Izah نور الایضاح مکتبۃ رحمانیہ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/NOOR-UL-EZAH-RAHMANIA-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19285,
    title: 'Noor ul Izah نور الایضاح مکتبۃ البشری',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/NoorUlEzahAlBushraColor-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19286,
    title: 'Hashia Al Tahtawi Ala Maraqi al Falah حاشیۃ الطحطاوی علی مراقی الفلاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/Hashia-Al-Tahtawi-200x300.jpg',
    sub_category: 'عربی شروحات',
  },
  {
    id: 19287,
    title: 'Maraqi al Falah Arabic Sharh Noor ul Izah مراقی الفلاح عربی شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/Maraqil-Falah-200x300.jpg',
    sub_category: 'عربی شروحات',
  },
  {
    id: 19288,
    title: 'Shifa ul Arwah Urdu Sharh Noor ul Izah شفاء الارواح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/Shifa-Ul-Arwaah-Urdu-Sharah-Noor-Ezah-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19289,
    title: 'Samaratun Najah Urdu Sharh Noor ul Izah ثمرۃ النجاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/Samarat_Un_Najah-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19290,
    title: 'Imdad ul Fattah Arabic Sharh Noor ul Izah امداد الفتاح عربی شرح نورالایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/IMDAD-UL-FATTAH-200x300.jpg',
    sub_category: 'عربی شروحات',
  },
  {
    id: 19291,
    title: 'Anwar ul Izah Urdu Sharh Noor ul Izah انوار الایضاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/AnwaarUlEizahUrduSharhNoorUlEizah-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19292,
    title: 'Noor ul Isbah Urdu Sharh Noor ul Izah نور الاصباح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/NoorUlIsbahUrduSharhNoorUlEizah-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19293,
    title: 'Ashraf ul Izah Urdu Sharh Noor ul Izah اشرف الایضاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/AshrafUlEizahUrduSharhNoorUlEizah-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19294,
    title: 'Takmil ul Izah Urdu Sharh Noor ul Izah تکمیل الایضاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/TakmeelUlEizahUrduSharhNoorUlEizah-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19295,
    title: 'Al Fiqh ul Muyassar الفقہ المیسر',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/AlFiqhUlMuyassar-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19296,
    title: 'Al Fiqh ul Muyassar Urdu الفقہ المیسر اردو',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/AL-FIQH-UL-MUYASSAR-URDU-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19297,
    title: 'Kareema Sadi Al Bushra کریمہ سعدی البشری',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/KaremaSadeeAlBushraColor-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19298,
    title: 'Kimiya Urdu Sharh Kareema کیمیا اردو شرح کریمہ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/KIMIY_URDU_SHARH_KARIMA-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19299,
    title: 'Gohar Be Baha گوہر بے بہا',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2021/03/Gohar_Be_Baha-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19300,
    title: 'Raheema Sharh Kareema رحیمہ شرح کریمہ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2024/02/RAHEEMA_SHARH_KAREEMA-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19301,
    title: 'Nahw Meer Urdu نحو میر اردو',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/07/NAHWMEER_URDU-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19302,
    title: 'Rahnuma e Tarkeeb رہنمائے ترکیب',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/07/RAHNUMA_E_TARKEEB-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19303,
    title: 'Qanooncha e Usmani قانونچہ عثمانی',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/05/QANOONCHA_E_USMANI-200x300.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19304,
    title: 'Kashful Awamil Sharh Sharh-e-Miata Amil کشف العوامل شرح اردو شرح مائۃ عامل',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/KASHF_UL_AWAMIL_SHARH_SHARH_E_MIATA_AMIL-200x300.jpg',
    sub_category: 'اردو شروحات',
  },
];

// ═══════════════════════════════════════════════════════════════
// PART 2: Fix sub_category for Sharah books wrongly marked as Darsi
// These are commentary/sharah books that should be in اردو شروحات or عربی شروحات
// ═══════════════════════════════════════════════════════════════

const SUB_CATEGORY_FIXES = [
  // Nahw Mir Shurohat (Urdu)
  { id: 17122, sub_category: 'اردو شروحات' }, // Tanveer Urdu Sharh Nahwmeer
  { id: 19160, sub_category: 'اردو شروحات' }, // Ashraf un Nahw Sharah Urdu Nahw Mir
  { id: 19161, sub_category: 'اردو شروحات' }, // Durr e Benazir Urdu Sharh Nahw Mir
  { id: 19162, sub_category: 'اردو شروحات' }, // Reehul Abeer Urdu Sharh Nahw mir
  { id: 19163, sub_category: 'اردو شروحات' }, // Tazkeer Urdu Sharh Nahw Meer
  { id: 19164, sub_category: 'اردو شروحات' }, // Badr e Muneer Urdu Sharh Nahw Meer
  { id: 19165, sub_category: 'اردو شروحات' }, // Hadya e Sagheer Urdu Sharh Nahwmee
  { id: 19166, sub_category: 'اردو شروحات' }, // Al Tanveer Urdu Sharh Nahwmeer
  { id: 19168, sub_category: 'اردو شروحات' }, // Badrus Saeed Sharah e Urdu Nahwmir
  { id: 19170, sub_category: 'اردو شروحات' }, // Sayul Faqeer Urdu Sharh NahwMeer
  { id: 19172, sub_category: 'اردو شروحات' }, // Dhawul Mustanir Urdu Sharah Nahwmir
  { id: 19173, sub_category: 'اردو شروحات' }, // Kaukab ul Munir Sharah Urdu Nahwmir
  
  // Irshad us Sarf Shurohat (Urdu)
  { id: 19178, sub_category: 'اردو شروحات' }, // Irshad Al Tamreen Sharh Urdu Irshad Al Sarf
  { id: 19179, sub_category: 'اردو شروحات' }, // Mihaj us Sarf Urdu Sharh Irshad Us Sarf
  { id: 19180, sub_category: 'اردو شروحات' }, // Tanweer us Sarf Urdu Sharh Irshad Us Sarf
  { id: 19181, sub_category: 'اردو شروحات' }, // Izhar us Sadaf Urdu Sharh Irshad us Sarf
  { id: 19182, sub_category: 'اردو شروحات' }, // Khair uz Zad Urdu Sharh Irshad us Sarf
  { id: 19184, sub_category: 'اردو شروحات' }, // Maarif Us Sarf Urdu Sharh Irshad Us Sarf
  { id: 19185, sub_category: 'اردو شروحات' }, // Imla Us Sarf Urdu Sharh Irshad Us Sarf
  { id: 19186, sub_category: 'اردو شروحات' }, // Anwaar Us Sarf Urdu Sharh Irshad Us Sarf
  
  // Tasheel un Nahw Sharah
  { id: 19203, sub_category: 'اردو شروحات' }, // Riaz Un Nahw Urdu Sharh Tasheel Un Nahw
  
  // Sharh Ilm us Sarf
  { id: 19209, sub_category: 'اردو شروحات' }, // Sharh Ilm us Sarf Awwalain
  
  // Al Tariqat ul Asria Sharah
  { id: 19225, sub_category: 'اردو شروحات' }, // Al Hadaiq ul Arabia Urdu Sharh Al Tariqat ul Asria
  
  // Taleem ul Muta'allim Sharah
  { id: 19230, sub_category: 'اردو شروحات' }, // Tafheem ul Muta'allim Sharh Taleem ul Muta'allim
  
  // Panj Ganj Sharah
  { id: 19235, sub_category: 'اردو شروحات' }, // Ganjina e Sarf Urdu Sharah Panj Gang
  
  // Sharh Miata Aamil - These are actually textbook level (Sharh = the actual book, not a commentary on it)
  // Keep as درسی کتب: 19191, 19192, 19193
  // But the Urdu Sharah of Sharh Miata Aamil is a commentary:
  { id: 19194, sub_category: 'اردو شروحات' }, // AL BASHEER UL KAMIL Sharh urdu Sharh e Miata Aamil
];

// ═══════════════════════════════════════════════════════════════
// PART 3: Fix 5 broken cover URLs
// ═══════════════════════════════════════════════════════════════

const BROKEN_COVER_FIXES = [
  {
    id: 19173, // Kaukab ul Munir - already being fixed in SUB_CATEGORY_FIXES
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2017/12/KAUKAB-UL-MUNIR-200x300.jpg',
  },
  {
    id: 19188, // Mizan ul Afaal
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/MIZAN-UL-AFAAL-200x300.jpg',
  },
  {
    id: 19193, // Sharh e Miata Aamil
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/SHARH-MIATA-AAMIL-200x300.jpg',
  },
  {
    id: 19230, // Tafheem ul Muta'allim
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/TAFHEEM-UL-MUTAALLIM-200x300.jpg',
  },
  {
    id: 19236, // Panj Ganj Urdu
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2022/04/PANJ-GANJ-URDU-200x300.jpg',
  },
];

async function applyFixes() {
  let success = 0;
  let errors = 0;

  // PART 1: Fix corrupted books
  console.log('PART 1: Fixing 22 corrupted books (titles + covers + sub_category)...');
  for (const fix of FIXES) {
    const updateData = { title: fix.title, cover_url: fix.cover_url, sub_category: fix.sub_category };
    const { error } = await supabase.from('Books').update(updateData).eq('id', fix.id);
    if (error) {
      console.log(`  ERROR updating id ${fix.id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK: id ${fix.id} - ${fix.title.substring(0, 40)}`);
      success++;
    }
  }

  // PART 2: Fix sub_category
  console.log('\nPART 2: Fixing sub_category for misclassified sharah books...');
  for (const fix of SUB_CATEGORY_FIXES) {
    const { error } = await supabase.from('Books').update({ sub_category: fix.sub_category }).eq('id', fix.id);
    if (error) {
      console.log(`  ERROR updating id ${fix.id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK: id ${fix.id}`);
      success++;
    }
  }

  // PART 3: Fix broken covers
  console.log('\nPART 3: Fixing 5 broken cover URLs...');
  for (const fix of BROKEN_COVER_FIXES) {
    const { error } = await supabase.from('Books').update({ cover_url: fix.cover_url }).eq('id', fix.id);
    if (error) {
      console.log(`  ERROR updating id ${fix.id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK: id ${fix.id}`);
      success++;
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`Success: ${success}, Errors: ${errors}`);
}

applyFixes().catch(console.error);
