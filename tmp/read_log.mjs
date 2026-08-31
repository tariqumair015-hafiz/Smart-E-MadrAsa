import * as fs from 'fs';

const v = fs.readFileSync('tmp/scrape_7th_year_out.txt', 'utf-16le');
fs.writeFileSync('tmp/7th_year_log_utf8.txt', v);
