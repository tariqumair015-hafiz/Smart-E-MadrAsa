import fs from 'fs';
import { build } from 'vite';

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function (path, ...args) {
  const pathStr = String(path);
  if (pathStr.endsWith('.js') || pathStr.endsWith('.jsx') || pathStr.endsWith('.json') || pathStr.endsWith('.css')) {
    console.log('[READ Sync]', pathStr);
  }
  return Reflect.apply(originalReadFileSync, fs, [path, ...args]);
};

const originalReadFile = fs.readFile;
fs.readFile = function (path, ...args) {
  const pathStr = String(path);
  if (pathStr.endsWith('.js') || pathStr.endsWith('.jsx') || pathStr.endsWith('.json') || pathStr.endsWith('.css')) {
    console.log('[READ Async]', pathStr);
  }
  return Reflect.apply(originalReadFile, fs, [path, ...args]);
};

const originalPromisesReadFile = fs.promises.readFile;
fs.promises.readFile = function (path, ...args) {
  const pathStr = String(path);
  if (pathStr.endsWith('.js') || pathStr.endsWith('.jsx') || pathStr.endsWith('.json') || pathStr.endsWith('.css')) {
    console.log('[READ Promise]', pathStr);
  }
  return Reflect.apply(originalPromisesReadFile, fs.promises, [path, ...args]);
};

console.log('Starting build...');
build().catch(err => {
  console.error('Build failed with error:', err);
  if (err.stack) {
    console.error(err.stack);
  }
});
