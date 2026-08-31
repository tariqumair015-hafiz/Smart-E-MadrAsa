import { readFileSync, writeFileSync } from 'fs';

const r = JSON.parse(readFileSync('tmp/audit_result.json', 'utf8'));

const lines = [];
lines.push('=== SUMMARY ===');
lines.push(JSON.stringify(r.summary, null, 2));

lines.push('\n=== MISSING COVERS (22 books) ===');
r.missingCovers.forEach((b,i) => lines.push(`${i+1}. ${b.title}`));

lines.push('\n=== BROKEN COVERS ===');
r.brokenCovers.forEach((b,i) => lines.push(`${i+1}. ${b.title} -> status: ${b.status}`));

lines.push('\n=== NISAB BOOKS FOUND (48) ===');
r.nisabFound.forEach((b,i) => lines.push(`${i+1}. [${b.has_cover?'HAS_COVER':'NO_COVER'}] ${b.title} (matched: ${b.keyword_matched})`));

lines.push('\n=== ALL DARSI BOOKS (107) ===');
r.darsi.forEach((b,i) => {
  const coverStatus = b.cover_url === 'MISSING' ? 'NO_COVER' : 'HAS_COVER';
  lines.push(`${i+1}. [${coverStatus}] ${b.title}`);
});

writeFileSync('tmp/audit_readable.txt', lines.join('\n'), 'utf8');
console.log('Written to tmp/audit_readable.txt');
