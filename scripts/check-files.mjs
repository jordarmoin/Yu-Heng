import fs from 'node:fs';
import path from 'node:path';
export function checkFiles(root) {
  let count = 0;
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(file);
      else if (fs.statSync(file).size >= 24_000_000) throw new Error(`File ≥24 MB: ${file}`);
      else count++;
    }
  }
  walk(root);
  console.log(`Strict 24 MB check: ${count} files passed (${root}).`);
}
if (process.argv[1]?.endsWith('check-files.mjs')) checkFiles(process.argv[2]==='dist'?(process.env.GALLERY_OUTDIR||'dist'):process.argv[2] || 'content');
