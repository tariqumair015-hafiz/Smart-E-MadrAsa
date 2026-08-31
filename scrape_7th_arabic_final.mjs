import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymizqgtlnhvkqlidftiy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pEIwC8Z8LlWEfcMst9ruFg_SO9_MhUI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORY = 'درجہ سابعہ';
const SUB_CATEGORY = 'عربی شروحات';
const YEAR = 7;

// All books extracted from both pages of:
// https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-arabic-shuroohat/
// Only Link 1 (archive.org) download links are used per user's instruction.

const books = [
  // ======= PAGE 1 =======
  {
    title: 'Lamaat ut Tanqeeh Arabic Sharh Mishkat ul Masabeeh لمعات التنقیح عربی شرح مشکاۃ المصابیح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2015/02/LAMAAT-UN-TANQEEH.jpg',
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-01.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-02.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-03.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-04.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-05.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-06.pdf' },
      { title: 'Vol 07', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-07.pdf' },
      { title: 'Vol 08', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-08.pdf' },
      { title: 'Vol 09', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-09.pdf' },
      { title: 'Vol 10', url: 'https://archive.org/download/DarsENizamiDoraEHadees8thYear/LAMAAT-UN-TANQEEH-VOL-10.pdf' },
    ],
  },
  {
    title: 'Hashia Sialkoti Alal Baizawi حاشیہ سیالکوٹی عربی',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2020/04/HASHIA-SIALKOTI-ALA-AL-BAIZAWI.jpg',
    volumes: [
      { title: 'Download', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/HASHIA-SIALKOTI-ALAL-BAIZAWI.pdf' },
    ],
  },
  {
    title: 'Al Qunavi Arabic Hashia Al Baizawi حاشية القونوی عربی حاشیہ تفسیر البیضاوی',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2020/04/al-qunavi-arabic-hashia-al-baizawi.jpg',
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_01.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_02.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_03.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_04.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_05.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_06.pdf' },
      { title: 'Vol 07', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_07.pdf' },
      { title: 'Vol 08', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_08.pdf' },
      { title: 'Vol 09', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_09.pdf' },
      { title: 'Vol 10', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_10.pdf' },
      { title: 'Vol 11', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_11.pdf' },
      { title: 'Vol 12', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_12.pdf' },
      { title: 'Vol 13', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_13.pdf' },
      { title: 'Vol 14', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_14.pdf' },
      { title: 'Vol 15', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_15.pdf' },
      { title: 'Vol 16', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_16.pdf' },
      { title: 'Vol 17', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_17.pdf' },
      { title: 'Vol 18', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_18.pdf' },
      { title: 'Vol 19', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_19.pdf' },
      { title: 'Vol 20', url: 'https://archive.org/download/HashiaAlQonaviAlBaizavi/Hashia_Al_Qonavi_Al_Baizavi_20.pdf' },
    ],
  },
  {
    title: 'Hashia Shaykhzada Ala Tafseer Al Baizawi حاشیۃ شیخ زادہ عربی حاشیہ تفسیر البیضاوی',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2020/04/hashia-shykhzada-ala-tafseer-al-baizawi.jpg',
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_1.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_2.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_3.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_4.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_5.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_6.pdf' },
      { title: 'Vol 07', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_7.pdf' },
      { title: 'Vol 08', url: 'https://archive.org/download/HashiaShaykhZadaSharhAlBaizawi/Hashia_Shaykh_Zada_Sharh_Al_%20Baizawi_Vol_8.pdf' },
    ],
  },
  {
    title: 'Hashia Al Shihab (Inaya tul Qazi / Kifaya tur Razi) حاشیۃ الشھاب عربی حاشیہ تفسیر البیضاوی',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2020/04/hashia-al-shihab.jpg',
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_1.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_2.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_3.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_4.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_5.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_6.pdf' },
      { title: 'Vol 07', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_7.pdf' },
      { title: 'Vol 08', url: 'https://archive.org/download/HashiaAlShihabAlBaizavi/Hashia_Al_Shihab_Al_Baizavi_8.pdf' },
    ],
  },
  {
    title: 'Mirqat Ul Mafateeh Arabic Sharh Mishkat ul Masabeeh مرقاة المفاتيح عربی شرح مشکاۃ المصابیح',
    cover_url: 'https://besturdubooks.net/wp-content/uploads/2020/04/mirqat-ul-mafateeh.jpg',
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_01.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_02.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_03.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_04.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_05.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_06.pdf' },
      { title: 'Vol 07', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_07.pdf' },
      { title: 'Vol 08', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_08.pdf' },
      { title: 'Vol 09', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_09.pdf' },
      { title: 'Vol 10', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_10.pdf' },
      { title: 'Vol 11', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_11.pdf' },
      { title: 'Vol 12', url: 'https://archive.org/download/MirqatUlMafateeh/Mirqat_Ul_Mafateeh_Vol_12.pdf' },
    ],
  },

  // ======= PAGE 2 =======
  {
    title: 'Al Taleeq ul Sabeeh Arabic Sharh Mishkat ul Masabeeh التعلیق الصبیح',
    cover_url: '', // Will need to scrape or handle — image on page 2
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/AlTaleeqAlSabeeh/Al-Taleeq-Al-Sabeeh-01.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/AlTaleeqAlSabeeh/Al-Taleeq-Al-Sabeeh-02.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/AlTaleeqAlSabeeh/Al-Taleeq-Al-Sabeeh-03.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/AlTaleeqAlSabeeh/Al-Taleeq-Al-Sabeeh-04.pdf' },
    ],
  },
  {
    title: 'Al Mafateeh Sharh Mishkat ul Masabeeh المفاتیح عربی شرح مشکوۃ المصابیح',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/besturdubooks2/Al-Mateeh-Sharh-Al-Masabeeh-Vol-1.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/besturdubooks2/Al-Mateeh-Sharh-Al-Masabeeh-Vol-2.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/besturdubooks2/Al-Mateeh-Sharh-Al-Masabeeh-Vol-3.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/besturdubooks2/Al-Mateeh-Sharh-Al-Masabeeh-Vol-4.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/besturdubooks2/Al-Mateeh-Sharh-Al-Masabeeh-Vol-5.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/besturdubooks2/Al-Mateeh-Sharh-Al-Masabeeh-Vol-6.pdf' },
    ],
  },
  {
    title: 'Al Taqrir ur Rafee Arabic Sharh Mishkat ul Masabeeh التقریر الرفیع عربی شرح مشکوۃ المصابیح',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Vol 1', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTaqreerUrRafeeVol1ArabicSharhMishkatUlMasabeeh.pdf' },
      { title: 'Vol 2', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/AlTaqreerUrRafeeVol2ArabicSharhMishkatUlMasabeeh.pdf' },
    ],
  },
  {
    title: 'Al Binaya Arabi Sharh Al Hidaya البنایۃ عربی شرح الھدایۃ',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Vol 01', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_01.pdf' },
      { title: 'Vol 02', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_02.pdf' },
      { title: 'Vol 03', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_03.pdf' },
      { title: 'Vol 04', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_04.pdf' },
      { title: 'Vol 05', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_05.pdf' },
      { title: 'Vol 06', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_06.pdf' },
      { title: 'Vol 07', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_07.pdf' },
      { title: 'Vol 08', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_08.pdf' },
      { title: 'Vol 09', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_09.pdf' },
      { title: 'Vol 10', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_10.pdf' },
      { title: 'Vol 11', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_11.pdf' },
      { title: 'Vol 12', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_12.pdf' },
      { title: 'Vol 13', url: 'https://archive.org/download/AlBinayaSharhAlHidayah/Al_Binaya_Sharh_Al_Hidayah_13.pdf' },
    ],
  },
  {
    title: 'Nuzha tun Nazar Arabic Sharh e Nukhbah tul Fikar نزھۃ النظر عربی شرح شرح نخبۃ الفکر',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Download', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/SHARH_NUZHA_TUN_NAZAR.pdf' },
    ],
  },
  {
    title: 'Imaan un Nazar Arabic Sharh Sharh-e-Nukhbah al Fikr امعان النظر عربى شرح شرح نخبة الفكر',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Download', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/IMAAN_UN_NAZAR_ARABIC_SHARH_SHARH_E_NUKHBAH.pdf' },
    ],
  },
  {
    title: 'Bahjatun Nazar Arabic Sharh Sharh-e-Nukhbah بھجۃ النظر عربى شرح شرح نخبة الفكر',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Download', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/BAHJAH_TUN_NAZAR_ARABIC_SHARH_SHARH_E_NUKHBAH.pdf' },
    ],
  },
  {
    title: 'Al Hashia Alal Mutawwal الحاشیۃ علی المطول عربی',
    cover_url: '', // Will scrape
    volumes: [
      { title: 'Download', url: 'https://archive.org/download/HashiaAlalMutawwal/Hashia_Alal_Mutawwal.pdf' },
    ],
  },
];

// Step 1: Scrape cover images from page 2 using cheerio
import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapePage2Covers() {
  console.log('📸 Scraping page 2 cover images...');
  try {
    const res = await axios.get(
      'https://besturdubooks.net/dars-e-nizami/maoqoof-alai-7th-year/maoqoof-alai-arabic-shuroohat/2/',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' }, timeout: 30000 }
    );
    const $ = cheerio.load(res.data);
    const content = $('.entry-content');
    const images = content.find('img');
    const covers = [];

    images.each((i, el) => {
      const img = $(el);
      let coverUrl = img.attr('data-lazy-src') || img.attr('data-src') || img.attr('data-orig-src') || img.attr('src') || '';
      if (!coverUrl || coverUrl.includes('logo') || coverUrl.includes('placeholder') || coverUrl.length < 20) return;

      // Clean WP CDN
      if (coverUrl.includes('i0.wp.com') || coverUrl.includes('i1.wp.com') || coverUrl.includes('i2.wp.com')) {
        coverUrl = coverUrl.replace(/https?:\/\/i[0-9]\.wp\.com\//, 'https://').split('?')[0];
      } else if (coverUrl.includes('?')) {
        coverUrl = coverUrl.split('?')[0];
      }

      const alt = img.attr('alt') || '';
      covers.push({ coverUrl, alt });
      console.log(`  Found cover: ${alt.substring(0, 50)} => ${coverUrl.substring(0, 80)}`);
    });

    return covers;
  } catch (e) {
    console.error('Error scraping page 2:', e.message);
    return [];
  }
}

// Map page 2 covers to books by matching title keywords
function mapCoversToBooks(covers) {
  const titleMap = [
    { idx: 6, keywords: ['taleeq', 'sabeeh', 'التعلیق'] },
    { idx: 7, keywords: ['mafateeh', 'المفاتیح', 'masabeeh'] },
    { idx: 8, keywords: ['taqrir', 'rafee', 'التقریر'] },
    { idx: 9, keywords: ['binaya', 'البنایۃ', 'hidaya'] },
    { idx: 10, keywords: ['nuzha', 'نزھۃ'] },
    { idx: 11, keywords: ['imaan', 'امعان'] },
    { idx: 12, keywords: ['bahjat', 'بھجۃ'] },
    { idx: 13, keywords: ['mutawwal', 'المطول'] },
  ];

  for (const cover of covers) {
    const alt = (cover.alt || '').toLowerCase();
    for (const tm of titleMap) {
      if (books[tm.idx].cover_url) continue; // Already mapped
      const matched = tm.keywords.some(kw => alt.includes(kw.toLowerCase()) || cover.coverUrl.toLowerCase().includes(kw.toLowerCase()));
      if (matched) {
        books[tm.idx].cover_url = cover.coverUrl;
        console.log(`  ✅ Mapped cover for: ${books[tm.idx].title.substring(0, 50)}`);
        break;
      }
    }
  }

  // Sequential fallback: assign remaining covers to unmatched books in order
  let coverIdx = 0;
  for (const tm of titleMap) {
    if (!books[tm.idx].cover_url && coverIdx < covers.length) {
      books[tm.idx].cover_url = covers[coverIdx].coverUrl;
      console.log(`  ⚠️ Sequential cover assign for: ${books[tm.idx].title.substring(0, 50)}`);
    }
    coverIdx++;
  }
}

async function uploadToDB() {
  console.log(`\n📤 Uploading ${books.length} books to Supabase...`);
  console.log(`   Category: ${CATEGORY} | Sub: ${SUB_CATEGORY}`);

  let uploaded = 0;
  let skipped = 0;

  for (const book of books) {
    try {
      const primaryUrl = book.volumes[0].url;

      const dbBook = {
        title: book.title.trim(),
        author: 'BestUrduBooks',
        category: CATEGORY,
        sub_category: SUB_CATEGORY,
        cover_url: book.cover_url || '',
        pdf_url: primaryUrl, // 1st volume = primary download
        description: JSON.stringify(book.volumes),
        size_mb: 15,
        is_free: true,
        downloads: 0,
        rating: 0,
        pages: 0,
        year: YEAR,
      };

      // Use upsert on pdf_url conflict to avoid duplication
      const { error } = await supabase.from('Books').upsert([dbBook], { onConflict: 'pdf_url' });
      if (error) {
        console.log(`  ❌ [SKIP] ${book.title.substring(0, 50)}: ${error.message}`);
        skipped++;
      } else {
        console.log(`  ✅ [OK] ${book.title.substring(0, 50)} (${book.volumes.length} vols, cover: ${book.cover_url ? '✓' : '✗'})`);
        uploaded++;
      }
    } catch (err) {
      console.log(`  Exception: ${book.title.substring(0, 40)}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n🏁 DONE! Uploaded: ${uploaded}, Skipped: ${skipped}`);
}

async function run() {
  // Step 1: Scrape page 2 covers
  const page2Covers = await scrapePage2Covers();
  
  // Step 2: Map covers to page 2 books 
  if (page2Covers.length > 0) {
    mapCoversToBooks(page2Covers);
  }

  // Step 3: Verify all covers
  console.log('\n📋 Final book list:');
  books.forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.title.substring(0, 60)} | Vols: ${b.volumes.length} | Cover: ${b.cover_url ? '✓' : '✗'}`);
  });

  // Step 4: Upload to DB
  await uploadToDB();
}

run();
