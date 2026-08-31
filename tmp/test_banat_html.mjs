import axios from 'axios';
import fs from 'fs';

async function run() {
  try {
    const url = 'https://besturdubooks.net/dars-e-nizami-banat-girls/khasa-banat-first-year-books/';
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    fs.writeFileSync('tmp/banat_landing.html', data);
    console.log("Saved to tmp/banat_landing.html");
  } catch (err) {
    console.error(err.message);
  }
}

run();
