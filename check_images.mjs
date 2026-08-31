import axios from 'axios';

const urls = [
  'https://besturdubooks.net/wp-content/uploads/2018/10/Kanz-Ud-Daqaiq.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/10/Kanz-ud-Daqaiq.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/10/Qamus-Ul-Fiqh.jpg', 
  'https://besturdubooks.net/wp-content/uploads/2018/10/Noor-ul-Anwaar-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/10/Noor-ul-Anwar.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/09/Maqamat-e-Hariri.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/09/Maqamat-e-Hariri-200x300.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Balaghat-Ul-Waziha.jpg',
  'https://besturdubooks.net/wp-content/uploads/2018/10/Al-Balaghat-Ul-Waziha-200x300.jpg'
];

async function check() {
  for (const u of urls) {
    try {
      const res = await axios.head(u);
      console.log('OK:', u);
    } catch (e) {
      console.log('FAIL:', u, e.response ? e.response.status : e.message);
    }
  }
}
check();
