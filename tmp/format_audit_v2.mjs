import { readFileSync, writeFileSync } from 'fs';

const r = JSON.parse(readFileSync('tmp/audit_result.json', 'utf8'));

// Write a clean ASCII-safe report
const lines = [];
lines.push('=== AUDIT SUMMARY ===');
lines.push('Total books in category: ' + r.summary.total_books);
lines.push('Darsi (textbooks): ' + r.summary.darsi_count);
lines.push('Urdu Sharah: ' + r.summary.urdu_sharah_count);
lines.push('Arabic Sharah: ' + r.summary.arabi_sharah_count);
lines.push('Missing covers: ' + r.summary.missing_covers);
lines.push('Broken cover URLs: ' + r.summary.broken_covers);
lines.push('Nisab books matched: ' + r.summary.nisab_books_found);

lines.push('');
lines.push('=== MISSING COVERS ===');
r.missingCovers.forEach((b,i) => {
  // Use only ASCII-safe chars from the title
  lines.push((i+1) + '. ' + b.title);
});

lines.push('');
lines.push('=== BROKEN COVERS ===');
r.brokenCovers.forEach((b,i) => {
  lines.push((i+1) + '. ' + b.title + ' -> status ' + b.status);
});

lines.push('');
lines.push('=== NISAB BOOKS FOUND ===');
r.nisabFound.forEach((b,i) => {
  lines.push((i+1) + '. ' + (b.has_cover ? 'COVER_OK' : 'NO_COVER') + ' | ' + b.title + ' | keyword: ' + b.keyword_matched);
});

lines.push('');
lines.push('=== ALL DARSI BOOKS ===');
r.darsi.forEach((b,i) => {
  const cs = b.cover_url === 'MISSING' ? 'NO_COVER' : 'COVER_OK';
  lines.push((i+1) + '. ' + cs + ' | ' + b.title);
});

// Write as utf8 with BOM for windows
writeFileSync('tmp/audit_report.md', lines.join('\n'), { encoding: 'utf8' });
console.log('DONE');
