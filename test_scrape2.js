const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://besturdubooks.net/dars-e-nizami/dora-e-hadith-books/dora-e-hadith-urdu-shuroohat/').then(res => {
    const $ = cheerio.load(res.data);
    const links = [];
    $('article h2 a').each((i, el) => links.push($(el).attr('href')));
    console.log("Found links:", links);
});
