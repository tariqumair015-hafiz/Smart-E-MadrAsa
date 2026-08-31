async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    console.log(`${url} -> ${res.status}`);
  } catch (e) {
    console.log(`${url} -> ERROR: ${e.message}`);
  }
}

async function run() {
  const urls = [
    'https://besturdubooks.net/wp-content/uploads/2020/04/Mishkat-al-Masabeeh-Urdu.jpg',
    'https://besturdubooks.net/wp-content/uploads/2018/11/Mishkat-Ul-Masabeeh.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Taiseer-E-Mustalah-Ul-Hadith.jpg',
    'https://besturdubooks.net/wp-content/uploads/2018/12/Taiseer-E-Mustalah-Ul-Hadith.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhba-Tul-Fikr.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhba-Tul-Fikr-Al-Bushra.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhat-un-Nazar.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/SharahNukhbaTulFikrAlBushraColor.jpg',
  ];
  for (const url of urls) {
    await checkUrl(url);
  }
}
run();
