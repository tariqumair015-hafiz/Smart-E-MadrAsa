async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.status === 200) {
      console.log(`${url} -> 200`);
    }
  } catch (e) {
    // Ignore
  }
}

async function run() {
  const urls = [
    'https://besturdubooks.net/wp-content/uploads/2026/05/%D9%86%D8%B2%D9%87%D8%A9-%D8%A7%D9%84%D9%86%D8%B8%D8%B1-%D9%81%D9%8A-%D8%AA%D9%88%D8%B6%D9%8A%D8%AD-%D9%86%D8%AE%D8%A8%D8%A9-%D8%A7%D9%84%D9%81%D9%83%D8%B1.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhat-ul-Nazar-Al-Bushra.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhat-un-Nazar-Al-Bushra.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhat-un-Nazar.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhat-ul-Nazar.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbatul-Fikar-Al-Bushra.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbat-ul-Fikar-Al-Bushra.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbatul-Fikr-Al-Bushra.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbat-ul-Fikr-Al-Bushra-Color.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbatul-Fikr-Al-Bushra-Color.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbatul-Fikr.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Sharah-Nukhbat-ul-Fikr.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhatul-Nazar.jpg',
    'https://besturdubooks.net/wp-content/uploads/2020/04/Nuzhat-Un-Nazar-Sharh-Nukhbatul-Fikar.jpg',
  ];
  for (const url of urls) {
    await checkUrl(url);
  }
}
run();
