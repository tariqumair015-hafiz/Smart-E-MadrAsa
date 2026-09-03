import './merge_all_books.mjs';
import fs from 'fs';
import path from 'path';

const srcTexts = path.resolve('public/texts');
const distTexts = path.resolve('dist/texts');
const srcCovers = path.resolve('public/covers');
const distCovers = path.resolve('dist/covers');

if (fs.existsSync(path.resolve('dist'))) {
  if (fs.existsSync(srcTexts)) {
    fs.mkdirSync(distTexts, { recursive: true });
    fs.cpSync(srcTexts, distTexts, { recursive: true });
  }
  if (fs.existsSync(srcCovers)) {
    fs.mkdirSync(distCovers, { recursive: true });
    fs.cpSync(srcCovers, distCovers, { recursive: true });
  }
}
