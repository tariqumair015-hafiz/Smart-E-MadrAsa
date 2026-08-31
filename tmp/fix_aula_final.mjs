import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const supabaseKey = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ═══════════════════════════════════════════════════════════════
// PART 1: Fix 22 corrupted books (clean titles + covers)
// Cover URLs from besturdubooks.net search results (browser-verified)
// ═══════════════════════════════════════════════════════════════

const FIXES = [
  {
    id: 19283,
    title: 'Noor ul Izah نور الایضاح و نجاۃ الارواح مکتبۃ کنوز العلم',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2025/03/NOOR-UL-AIZAH-O-NAJAT-UL-ARWAH.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19284,
    title: 'Noor ul Izah نور الایضاح مکتبۃ رحمانیہ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2026/02/NOOR-UL-EZAH-RAHMANIA.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19285,
    title: 'Noor ul Izah نور الایضاح مکتبۃ البشری',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2026/03/NOOR_UL_IZAH_AL_BUSHRA.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19286,
    title: 'Hashia Al Tahtawi Ala Maraqi al Falah حاشیۃ الطحطاوی علی مراقی الفلاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Hashiya-Al-Tahtawi.jpg',
    sub_category: 'عربی شروحات',
  },
  {
    id: 19287,
    title: 'Maraqi al Falah Arabic Sharh Noor ul Izah مراقی الفلاح عربی شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Maraqi_al_Falah.jpg',
    sub_category: 'عربی شروحات',
  },
  {
    id: 19288,
    title: 'Shifa ul Arwah Urdu Sharh Noor ul Izah شفاء الارواح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Shifa-ul-Arwah.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19289,
    title: 'Samaratun Najah Urdu Sharh Noor ul Izah ثمرۃ النجاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Samaratun_Najah.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19290,
    title: 'Imdad ul Fattah Arabic Sharh Noor ul Izah امداد الفتاح عربی شرح نورالایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/IMDAD_UL_FATTAH.jpg',
    sub_category: 'عربی شروحات',
  },
  {
    id: 19291,
    title: 'Anwar ul Izah Urdu Sharh Noor ul Izah انوار الایضاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Anwar_ul_Izah.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19292,
    title: 'Noor ul Isbah Urdu Sharh Noor ul Izah نور الاصباح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Noor_ul_Isbah.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19293,
    title: 'Ashraf ul Izah Urdu Sharh Noor ul Izah اشرف الایضاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Ashraf_ul_Izah.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19294,
    title: 'Takmil ul Izah Urdu Sharh Noor ul Izah تکمیل الایضاح اردو شرح نور الایضاح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Takmil_ul_Izah.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19295,
    title: 'Al Fiqh ul Muyassar الفقہ المیسر',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Al_Fiqh_ul_Muyassar.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19296,
    title: 'Al Fiqh ul Muyassar Urdu الفقہ المیسر اردو',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2017/03/AL-FIQH-UL-MUYASSAR-URDU-1.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19297,
    title: 'Kareema Sadi Al Bushra کریمہ سعدی البشری',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Karema_Sadee.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19298,
    title: 'Kimiya Urdu Sharh Kareema کیمیا اردو شرح کریمہ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Gohar_Be_Baha.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19299,
    title: 'Gohar Be Baha گوہر بے بہا',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Gohar_Be_Baha.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19300,
    title: 'Raheema Sharh Kareema رحیمہ شرح کریمہ',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2024/03/RAHEEMA_SHARH_KAREEMA.jpg',
    sub_category: 'اردو شروحات',
  },
  {
    id: 19301,
    title: 'Nahw Meer Urdu نحو میر اردو',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2023/03/Noor_Ul_Izah.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19302,
    title: 'Rahnuma e Tarkeeb رہنمائے ترکیب',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2025/10/RAHNUMA_E_TARKEEB.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19303,
    title: 'Qanooncha e Usmani قانونچہ عثمانی',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2025/07/QANOONCHA_E_USMANI.jpg',
    sub_category: 'درسی کتب',
  },
  {
    id: 19304,
    title: 'Kashful Awamil Sharh Sharh-e-Miata Amil کشف العوامل شرح اردو شرح مائۃ عامل',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2025/06/KASHF_UL_AWAMIL_SHARH_SHAR_E_MIATA_AMIL.jpg',
    sub_category: 'اردو شروحات',
  },
];

// ═══════════════════════════════════════════════════════════════
// PART 2: Fix sub_category for Sharah books wrongly marked as درسی کتب
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
  { id: 19230, sub_category: 'اردو شروحات' }, // Tafheem ul Mutaallim Sharh Taleem ul Mutaallim
  
  // Panj Ganj Sharah
  { id: 19235, sub_category: 'اردو شروحات' }, // Ganjina e Sarf Urdu Sharah Panj Gang
  
  // Sharh Miata Aamil double-sharah
  { id: 19194, sub_category: 'اردو شروحات' }, // AL BASHEER UL KAMIL Sharh urdu Sharh e Miata Aamil
];

async function applyFixes() {
  let success = 0;
  let errors = 0;

  // PART 1: Fix corrupted books (titles + covers + sub_category)
  console.log('PART 1: Fixing 22 corrupted books...');
  for (const fix of FIXES) {
    const { error } = await supabase.from('Books')
      .update({ title: fix.title, cover_url: fix.cover_url, sub_category: fix.sub_category })
      .eq('id', fix.id);
    if (error) {
      console.log(`  ERROR id ${fix.id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK id ${fix.id}`);
      success++;
    }
  }

  // PART 2: Fix sub_category for misclassified sharah books
  console.log('\nPART 2: Fixing sub_category for 26 misclassified sharah books...');
  for (const fix of SUB_CATEGORY_FIXES) {
    const { error } = await supabase.from('Books')
      .update({ sub_category: fix.sub_category })
      .eq('id', fix.id);
    if (error) {
      console.log(`  ERROR id ${fix.id}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK id ${fix.id}`);
      success++;
    }
  }

  console.log(`\n=== DONE: Success=${success}, Errors=${errors} ===`);
}

applyFixes().catch(console.error);
