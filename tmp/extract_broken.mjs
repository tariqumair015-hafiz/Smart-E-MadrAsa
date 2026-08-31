import { readFileSync, writeFileSync } from 'fs';
const r = JSON.parse(readFileSync('tmp/audit_result.json', 'utf8'));
writeFileSync('tmp/broken_covers.json', JSON.stringify(r.brokenCovers, null, 2), 'utf8');
console.log('Written', r.brokenCovers.length, 'broken covers to broken_covers.json');
