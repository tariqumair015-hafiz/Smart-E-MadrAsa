import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

console.log('🚀 Invoking High-Confidence Maktaba Jibreel Extractor Engine...');

const pythonScript = path.resolve('scripts/export_mjbx_to_r2.py');

if (!fs.existsSync(pythonScript)) {
  console.error('❌ scripts/export_mjbx_to_r2.py not found!');
  process.exit(1);
}

const result = spawnSync('python', [pythonScript], {
  stdio: 'inherit',
  shell: false,
  encoding: 'utf-8'
});

if (result.error) {
  console.error('❌ Error executing python extractor:', result.error.message);
} else {
  console.log('✅ Extractor process finished with code:', result.status);
}
