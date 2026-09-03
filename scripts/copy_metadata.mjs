import './merge_all_books.mjs';
import fs from 'fs';
import path from 'path';

const srcTexts = path.resolve('public/texts');
const distTexts = path.resolve('dist/texts');

if (fs.existsSync(srcTexts) && fs.existsSync(path.resolve('dist'))) {
  fs.mkdirSync(distTexts, { recursive: true });
  fs.cpSync(srcTexts, distTexts, { recursive: true });
}
