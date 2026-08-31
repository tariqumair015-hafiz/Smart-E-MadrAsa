import axios from 'axios';
import * as cheerio from 'cheerio';

(async () => {
  const urls = [
    'https://besturdubooks.net/maqalat-e-shibli/',
    'https://besturdubooks.net/al-farooq/',
    'https://besturdubooks.net/seerat-un-noman/',
    'https://besturdubooks.net/al-ghazali/'
  ];

  for(const url of urls) {
      console.log(`Checking ` + url);
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const imgs = [];
      $('img').each((i, e) => {
          let s = $(e).attr('src') || $(e).attr('data-src') || $(e).attr('data-lazy-src');
          if (s && s.includes('uploads') && !s.includes('logo') && !s.includes('banner')) {
              imgs.push(s);
          }
      });
      console.log(imgs);
  }
})();
