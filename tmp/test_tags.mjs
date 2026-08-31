import axios from 'axios';

// Test which tag names work on besturdubooks.net for our scholars
const tags = [
  "maulana-sarfaraz-khan-safdar-books",
  "maulana-tariq-jameel-books",
  "maulana-zahid-ur-rashidi-books",
  "maulana-zakariyya-kandhelvi-books",
  "maulana-zulfiqar-ahmad-naqshbandi-books",
  "mufti-abu-lubaba-shah-mansoor-books",
  "mufti-akhtar-imam-adil-qasmi-books",
  "mufti-inam-ul-haq-qasmi-books",
  "mufti-muhammad-shafi-books",
  "mufti-muhammad-taqi-usmani-books",
  "mufti-muhammad-jafar-milly-books",
  "mufti-rasheed-ahmad-ludhyanvi-books",
  "mufti-shoaibullah-khan-miftahi-books",
  "qari-muhammad-ishaq-multani-books"
];

async function test() {
  for (const tag of tags) {
    const url = `https://besturdubooks.net/tag/${tag}`;
    try {
      const resp = await axios.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0' }, 
        timeout: 15000,
        validateStatus: s => true 
      });
      console.log(`${tag} => ${resp.status}`);
    } catch(e) {
      console.log(`${tag} => ERROR: ${e.message}`);
    }
  }
}

test();
