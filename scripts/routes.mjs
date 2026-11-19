/** Directory-index rewrites for EdgeOne Pages (written into edgeone.json, which keeps its build keys).
 *  The custom domain's serving path does not map "/zh/works/x/" to "/zh/works/x/index.html" (preset domain does);
 *  see the lead's gallery-design/reports/G.md. One explicit rule per page, with and without the trailing slash,
 *  generated from content so a new work never silently 404s. No catch-all: real misses must stay 404s.
 *  Run: `node scripts/routes.mjs` (also run by prepare.mjs on every build). */
import fs from 'node:fs'; import path from 'node:path'; import { parse } from 'yaml';
import { fileURLToPath } from 'node:url';

export function pages(root = process.cwd()) {
  const works = [];
  const walk = (dir, rel = '') => {
    if (!fs.existsSync(dir)) return;
    const file = path.join(dir, 'item.yaml');
    if (fs.existsSync(file) && parse(fs.readFileSync(file, 'utf8'))?.status === 'published') works.push(rel);
    for (const e of fs.readdirSync(dir, { withFileTypes: true }))
      if (e.isDirectory() && !['media', 'files'].includes(e.name)) walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
  };
  walk(path.join(root, 'content/works'));
  return ['zh', 'en'].flatMap(lang => [`/${lang}`, `/${lang}/list`, ...works.sort().map(w => `/${lang}/works/${w}`)]);
}

export function syncRoutes(root = process.cwd()) {
  const file = path.join(root, 'edgeone.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rewrites = pages(root).flatMap(p => [p, p + '/'].map(source => ({ source, destination: `${p}/index.html` })));
  const next = JSON.stringify({ ...config, rewrites }, null, 2) + '\n';
  const changed = next !== fs.readFileSync(file, 'utf8');
  if (changed) fs.writeFileSync(file, next);
  return { changed, count: rewrites.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { changed, count } = syncRoutes();
  console.log(`edgeone.json: ${count} directory rewrites${changed ? ' (updated — commit it)' : ''}`);
}
