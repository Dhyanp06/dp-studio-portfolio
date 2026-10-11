// Usage: npm run check-images
// Lists which expected image slots have a file in src/assets/projects/.
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, parse } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'projects');
const files = existsSync(dir) ? readdirSync(dir) : [];
const byBase = new Map(files.map((f) => [parse(f).name, f]));

const cats = ['social', 'banners', 'email', 'motion', 'campaign', 'other'];
const craft = ['type', 'layout', 'color', 'social', 'brand'];
const process = ['brief', 'concept', 'explore', 'feedback', 'final'];

const groups = {
  'Chapter 01': ['early-1', 'early-2', 'early-3'],
  'Chapter 02': craft.flatMap((c) => [1, 2].map((n) => `craft-${c}-${n}`)),
  'Chapter 03': cats.flatMap((c) => [1, 2].map((n) => `${c}-${n}`)),
  'Chapter 04': process.map((p, i) => `process-${i + 1}-${p}`),
};

let found = 0, total = 0;
for (const [title, names] of Object.entries(groups)) {
  console.log(`\n${title}`);
  for (const n of names) {
    total++;
    const hit = byBase.get(n);
    if (hit) { found++; console.log(`  ✅ ${n}  →  ${hit}`); }
    else console.log(`  ⬜ ${n}  (placeholder)`);
  }
}
const known = new Set(Object.values(groups).flat());
const extra = [...byBase.keys()].filter((k) => !known.has(k) && k !== 'README');
if (extra.length) console.log(`\nOther files (only used if referenced in src/data): ${extra.join(', ')}`);
console.log(`\n${found}/${total} slots filled.`);
