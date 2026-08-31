import fs from 'fs';
import * as cheerio from 'cheerio';

const content = fs.readFileSync('page_dump.html', 'utf8');
const $ = cheerio.load(content);
console.log('Title: ' + $('title').text());
console.log('Heading: ' + $('h1').text());
console.log('Pagination text: ' + $('.entry-content .nav-links').text());
