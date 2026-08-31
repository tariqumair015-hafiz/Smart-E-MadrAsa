async function run() {
  const url = `https://besturdubooks.net/?s=${encodeURIComponent('Taiseer e Mustalah ul Hadith')}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
      }
    });
    const html = await res.text();
    const target = 'Taiseer e Mustalah al Hadith';
    const index = html.indexOf(target);
    if (index !== -1) {
      console.log(`Found target at index ${index}. Surrounding HTML:\n`);
      console.log(html.substring(index - 400, index + 800));
    } else {
      console.log('Target not found!');
    }
  } catch (e) {
    console.error(e);
  }
}
run();
