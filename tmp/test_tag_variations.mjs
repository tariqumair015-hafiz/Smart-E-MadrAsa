import axios from 'axios';

// Try alternate tag variations for 404 scholars
const variations = {
  "zahid-ur-rashdi": [
    "maulana-zahid-ur-rashdi-books",
    "zahid-ur-rashidi-books", 
    "maulana-zahid-ur-rashdi",
    "zahid-ur-rashdi-books",
    "maulana-zahid-al-rashdi-books"
  ],
  "zakariyya-kandhelvi": [
    "shaykh-ul-hadees-maulana-zakariya-books",
    "maulana-zakariya-kandhlawi-books",
    "maulana-zakariya-books",
    "shaykh-ul-hadith-zakariyya-books",
    "maulana-muhammad-zakariyya-kandhelvi-books",
    "maulana-muhammad-zakariya-books"
  ],
  "rasheed-ludhianvi": [
    "mufti-rasheed-ahmad-ludhianvi-books",
    "mufti-rasheed-ahmed-ludhianvi-books",
    "mufti-rashid-ahmad-ludhianvi-books",
    "mufti-rasheed-ludhianvi-books",
    "mufti-rashid-ahmed-ludhyanvi-books"
  ],
  "ishaq-multani": [
    "maulana-muhammad-ishaq-multani-books",
    "muhammad-ishaq-multani-books",
    "qari-ishaq-multani-books",
    "qari-muhammad-ishaq-books"
  ]
};

async function test() {
  for (const [scholar, tags] of Object.entries(variations)) {
    console.log(`\n=== Testing ${scholar} ===`);
    for (const tag of tags) {
      const url = `https://besturdubooks.net/tag/${tag}`;
      try {
        const resp = await axios.get(url, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 15000,
          validateStatus: s => true 
        });
        const status = resp.status === 200 ? '✓ FOUND' : `✗ ${resp.status}`;
        console.log(`  ${tag} => ${status}`);
        if (resp.status === 200) break; // Found it!
      } catch(e) {
        console.log(`  ${tag} => ERROR: ${e.message}`);
      }
    }
  }
}

test();
