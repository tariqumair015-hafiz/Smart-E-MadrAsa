import axios from 'axios';

const urls = [
    'https://besturdubooks.net/dars-e-nizami/al-sania-2nd-year/page/2/',
    'https://besturdubooks.net/dars-e-nizami/al-sadesa-6th-year/page/2/'
];

async function check() {
    for (const url of urls) {
        try {
            const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
            console.log(`URL: ${url} | Status: ${res.status} | Length: ${res.data.length}`);
        } catch (e) {
            console.log(`URL: ${url} | Error: ${e.message}`);
        }
    }
}

check();
