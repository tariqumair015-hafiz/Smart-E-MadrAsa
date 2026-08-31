/**
 * 7th Year Textbooks — HARDCODED from besturdubooks.net pages 1 & 2
 * 
 * Data manually extracted from:
 * Page 1: https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/
 * Page 2: https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-text-books/2/
 * 
 * Rules:
 * - ONLY Link 1 (archive.org/download) — NO mediafire
 * - Vol 1 = primary pdf_url (showcase in app)
 * - All volumes in description for download page
 * - Cover from archive.org/services/img/{identifier}
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'درجہ سابعہ';
const SUB_CAT = 'درسی کتب';
const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';

// ── PAGE 1 BOOKS ─────────────────────────────────────────────────────────────
// cover: archive.org/services/img/{first-link-identifier}

const BOOKS = [

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────

  {
    title: 'Tafseer e Baizawi تفسیر بیضاوی مکمل',
    cover_url: 'https://archive.org/services/img/TafseerBaizawi',
    pdf_url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-01.pdf',
    volumes: [
      { title: 'Vol 1 (7MB)', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-01.pdf' },
      { title: 'Vol 2 (8MB)', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-02.pdf' },
      { title: 'Vol 3 (11MB)', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-03.pdf' },
      { title: 'Vol 4 (10MB)', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-04.pdf' },
      { title: 'Vol 5 (11MB)', url: 'https://archive.org/download/TafseerBaizawi/Tafseer-Baizawi-05.pdf' },
    ],
  },

  {
    title: 'Tafseer e Baizawi Al Bushra Color تفسیر بیضاوی البشری',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiAlBushraColor.pdf',
    volumes: [
      { title: 'Al Bushra Color (56MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiAlBushraColor.pdf' },
      { title: 'Al Bushra Black (7MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiAlBushra.pdf' },
    ],
  },

  {
    title: 'Tafseer e Baizawi Meer Muhammad تفسیر بیضاوی میر محمد',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiMeerMuhammad.pdf',
    volumes: [
      { title: 'Download (11MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiMeerMuhammad.pdf' },
    ],
  },

  {
    title: 'Tafseer e Baizawi Rahmania تفسیر بیضاوی رحمانیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRahmania.pdf',
    volumes: [
      { title: 'Download (12MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRahmania.pdf' },
    ],
  },

  {
    title: 'Tafseer e Baizawi Rashidia تفسیر بیضاوی رشیدیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRashedia.pdf',
    volumes: [
      { title: 'Download (12MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/TafseerUlBaizawiRashedia.pdf' },
    ],
  },

  {
    title: 'AL Tibyan Al Bushra التبیان فی علوم القرآن',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanAlBushraColor.pdf',
    volumes: [
      { title: 'Al Bushra Color (23MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanAlBushraColor.pdf' },
      { title: 'Al Bushra Black (5MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanAlBushra.pdf' },
      { title: 'Qadimi (4MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTibyanQadimi.pdf' },
    ],
  },

  {
    title: 'Mishkat ul Masabih Al Bushra مشکوۃ المصابیح البشری',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol1AlBushraColor.pdf',
    volumes: [
      { title: 'Vol 1 Color (66MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol1AlBushraColor.pdf' },
      { title: 'Vol 2 Color (55MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol2AlBushraColor.pdf' },
      { title: 'Vol 3 Color (55MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol3AlBushraColor.pdf' },
      { title: 'Vol 4 Color (57MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol4AlBushraColor.pdf' },
      { title: 'Vol 1 Black (8MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol1AlBushra.pdf' },
      { title: 'Vol 2 Black (7MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol2AlBushra.pdf' },
      { title: 'Vol 3 Black (7MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol3AlBushra.pdf' },
      { title: 'Vol 4 Black (7MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol4AlBushra.pdf' },
    ],
  },

  {
    title: 'Mishkat ul Masabih Qadimi مشکوۃ المصابیح قدیمی',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehQademi.pdf',
    volumes: [
      { title: 'Download (33MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehQademi.pdf' },
    ],
  },

  {
    title: 'Mishkat ul Masabih Rahmania مشکوۃ المصابیح رحمانیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol1Rahmania.pdf',
    volumes: [
      { title: 'Vol 1 (14MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol1Rahmania.pdf' },
      { title: 'Vol 2 (18MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol2Rahmania.pdf' },
    ],
  },

  {
    title: 'Mishkat ul Masabeeh Urdu مشکوۃ المصابیح (اردو ترجمہ)',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol1.pdf',
    volumes: [
      { title: 'Vol 1 (33MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol1.pdf' },
      { title: 'Vol 2 (28MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol2.pdf' },
      { title: 'Vol 3 (15MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol3.pdf' },
    ],
  },

  // ─── PAGE 2 ───────────────────────────────────────────────────────────────

  {
    title: 'Al Hidaya Al Bushra Vol 5-8 الھدایۃ البشری (جلد ۵-۸)',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol5AlBushraColor.pdf',
    volumes: [
      { title: 'Vol 5 Color (61MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol5AlBushraColor.pdf' },
      { title: 'Vol 6 Color (60MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol6AlBushraColor.pdf' },
      { title: 'Vol 7 Color (48MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol7AlBushraColor.pdf' },
      { title: 'Vol 8 Color (43MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol8AlBushraColor.pdf' },
      { title: 'Vol 5 Black (8MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol5AlBushra.pdf' },
      { title: 'Vol 6 Black (8MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol6AlBushra.pdf' },
      { title: 'Vol 7 Black (6MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol7AlBushra.pdf' },
      { title: 'Vol 8 Black (6MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol8AlBushra.pdf' },
    ],
  },

  {
    title: 'Al Hidaya Rahmania Vol 3-4 الھدایۃ رحمانیہ',
    cover_url: 'https://archive.org/services/img/ALHIDAYAH0',
    pdf_url: 'https://archive.org/download/ALHIDAYAH0/AL-HIDAYAH-VOL-3-RAHMANIA.pdf',
    volumes: [
      { title: 'Vol 3 (18MB)', url: 'https://archive.org/download/ALHIDAYAH0/AL-HIDAYAH-VOL-3-RAHMANIA.pdf' },
      { title: 'Vol 4 (14MB)', url: 'https://archive.org/download/ALHIDAYAH0/AL-HIDAYAH-VOL-4-RAHMANIA.pdf' },
    ],
  },

  {
    title: 'Al Hidaya Rashidia Vol 3-4 الھدایۃ رشیدیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol3Rashedia.pdf',
    volumes: [
      { title: 'Vol 3 (19MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol3Rashedia.pdf' },
      { title: 'Vol 4 (15MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlHidayahVol4Rashedia.pdf' },
    ],
  },

  {
    title: 'Nukhbatul Fikar ma Imdad un Nazar نخبۃ الفکر مع امداد النظر',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/NUHBA-TUL-FIKAR-IMDAD-UN-NAZAR.pdf',
    volumes: [
      { title: 'Download (4MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/NUHBA-TUL-FIKAR-IMDAD-UN-NAZAR.pdf' },
    ],
  },

  {
    title: 'Nuzha tun Nazar Sharh Nukhba tul Fikr (Al Bushra) نزھۃ النظر شرح نخبۃ الفکر',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/SharahNukhbaTulFikrAlBushraColor.pdf',
    volumes: [
      { title: 'Al Bushra Color (19MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/SharahNukhbaTulFikrAlBushraColor.pdf' },
      { title: 'Al Bushra Black (3MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/SharahNukhbaTulFikrAlBushra.pdf' },
      { title: 'Qadimi (6MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/SharahNukhbaTulFikrQademi.pdf' },
    ],
  },

  {
    title: 'Taiseer e Mustalah ul Hadith تیسیر مصطلح الحدیث',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/TaiseerEMustalahUlHadithAlBushraColor.pdf',
    volumes: [
      { title: 'Color (20MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/TaiseerEMustalahUlHadithAlBushraColor.pdf' },
      { title: 'Black (3MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/TaiseerEMustalahUlHadithAlBushra.pdf' },
    ],
  },

  {
    title: 'Al Mutawwal المطول',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AL-MUTAWWAL.pdf',
    volumes: [
      { title: 'Download (17MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AL-MUTAWWAL.pdf' },
    ],
  },

  {
    title: "Al Hai'at Ul Wusta الھیئۃ الوسطی",
    cover_url: 'https://archive.org/services/img/ALHAIATULWUSTA',
    pdf_url: "https://archive.org/download/ALHAIATULWUSTA/AL%20HAI'AT%20UL%20WUSTA.pdf",
    volumes: [
      { title: 'Download (20MB)', url: "https://archive.org/download/ALHAIATULWUSTA/AL%20HAI'AT%20UL%20WUSTA.pdf" },
    ],
  },

];

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log(`📚 Total textbooks to upload: ${BOOKS.length}`);

  // Clear existing
  const { error: delErr } = await supabase.from('Books').delete()
    .eq('category', CATEGORY).eq('sub_category', SUB_CAT);
  if (delErr) console.error('Delete error:', delErr.message);
  else console.log(`🗑️  Cleared existing درجہ سابعہ - درسی کتب`);

  let uploaded = 0, failed = 0;

  for (const book of BOOKS) {
    const { error } = await supabase.from('Books').insert([{
      title: book.title,
      author: 'BestUrduBooks',
      category: CATEGORY,
      sub_category: SUB_CAT,
      cover_url: book.cover_url,
      pdf_url: book.pdf_url,
      description: JSON.stringify(book.volumes),
      size_mb: 15,
      is_free: true,
      downloads: 0,
      rating: 0,
      pages: 0,
    }]);

    if (error) {
      console.log(`❌ ${book.title.substring(0, 40)}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ [${book.volumes.length} vols] ${book.title.substring(0, 60)}`);
      uploaded++;
    }
  }

  console.log(`\n🎉 Done! Uploaded: ${uploaded}, Failed: ${failed}`);
  console.log('\n📋 Summary:');
  BOOKS.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.title.substring(0, 55)}`);
    b.volumes.forEach(v => console.log(`     - ${v.title}: ${v.url.split('/').pop()}`));
  });
}

main().catch(console.error);
