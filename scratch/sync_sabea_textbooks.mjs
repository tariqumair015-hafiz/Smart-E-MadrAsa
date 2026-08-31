const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CATEGORY = 'درجہ سابعہ';
const SUB_CAT = 'درسی کتب';

const BOOKS = [
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
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehVol1AlBushraColor.pdf?cat=sabea',
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
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehQademi.pdf?cat=sabea',
    volumes: [
      { title: 'Download (33MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehQademi.pdf' },
    ],
  },
  {
    title: 'Mishkat ul Masabih Rahmania مشکوۃ المصابیح رحمانیہ',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol1Rahmania.pdf?cat=sabea',
    volumes: [
      { title: 'Vol 1 (14MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol1Rahmania.pdf' },
      { title: 'Vol 2 (18MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkarUlMasabeehVol2Rahmania.pdf' },
    ],
  },
  {
    title: 'Mishkat ul Masabeeh Urdu مشکوۃ المصابیح (اردو ترجمہ)',
    cover_url: 'https://archive.org/services/img/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear',
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol1.pdf?cat=sabea',
    volumes: [
      { title: 'Vol 1 (33MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol1.pdf' },
      { title: 'Vol 2 (28MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol2.pdf' },
      { title: 'Vol 3 (15MB)', url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear/MishkatUlMasabeehUrduVol3.pdf' },
    ],
  },
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
    pdf_url: 'https://archive.org/download/DarsENizamiDarjaSabeaaMaoqoofAlai7thYear01/TaiseerEMustalahUlHadithAlBushraColor.pdf?cat=sabea',
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
    title: 'Al Hai\'at Ul Wusta الھیئۃ الوسطی',
    cover_url: 'https://archive.org/services/img/ALHAIATULWUSTA',
    pdf_url: 'https://archive.org/download/ALHAIATULWUSTA/AL%20HAI\'AT%20UL%20WUSTA.pdf',
    volumes: [
      { title: 'Download (20MB)', url: 'https://archive.org/download/ALHAIATULWUSTA/AL%20HAI\'AT%20UL%20WUSTA.pdf' },
    ],
  },
];

async function syncBooks() {
  // Delete existing textbooks first to avoid duplicates or orphans
  const deleteUrl = `${SUPABASE_URL}/rest/v1/Books?category=eq.${encodeURIComponent(CATEGORY)}&sub_category=eq.${encodeURIComponent(SUB_CAT)}`;
  const delRes = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!delRes.ok) {
    console.error('Delete failed:', delRes.status, await delRes.text());
    return;
  }
  console.log('Successfully cleared existing textbooks for درجہ سابعہ');

  // Insert all 18 textbooks
  const insertUrl = `${SUPABASE_URL}/rest/v1/Books`;
  for (const book of BOOKS) {
    const payload = {
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
      pages: 0
    };

    const res = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`Failed to insert ${book.title}:`, res.status, await res.text());
    } else {
      console.log(`Successfully uploaded: ${book.title}`);
    }
  }

  // Load all Sabea books from DB and save them to sabea_final_books.json offline representation
  const allBooksUrl = `${SUPABASE_URL}/rest/v1/Books?category=eq.${encodeURIComponent(CATEGORY)}&select=*`;
  const allRes = await fetch(allBooksUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  if (allRes.ok) {
    const allData = await allRes.json();
    const fs = await import('fs');
    fs.writeFileSync('g:/My Drive/Smart E Madarsa/sabea_final_books.json', JSON.stringify(allData, null, 2), 'utf-8');
    console.log(`Successfully updated sabea_final_books.json offline file with all ${allData.length} books`);
  }
}

syncBooks().catch(console.error);
