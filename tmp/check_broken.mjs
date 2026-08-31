import { readFileSync } from 'fs';

const r = JSON.parse(readFileSync('tmp/audit_result.json', 'utf8'));

console.log('=== POST-FIX SUMMARY ===');
console.log('Total:', r.summary.total_books);
console.log('Darsi:', r.summary.darsi_count);
console.log('Urdu Sharah:', r.summary.urdu_sharah_count);
console.log('Arabic Sharah:', r.summary.arabi_sharah_count);
console.log('Missing covers:', r.summary.missing_covers);
console.log('Broken covers:', r.summary.broken_covers);
console.log('Nisab found:', r.summary.nisab_books_found);

console.log('\n=== BROKEN COVERS ===');
r.brokenCovers.forEach((b,i) => {
  console.log(`${i+1}. id=${b.title.substring(0,50)} status=${b.status}`);
  console.log(`   URL: ${b.cover_url}`);
});
