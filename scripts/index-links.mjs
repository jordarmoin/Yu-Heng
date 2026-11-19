/** Stopgap (2026-11-19): gallery.zyhzyh.me serves objects straight from storage and does not resolve "/zh/x/" to
 *  "/zh/x/index.html" (see CHANGELOG + lead's reports/G.md). After the build, point every internal page link at its
 *  explicit index.html so the site works on that domain. Canonical/hreflang/sitemap keep the pretty URLs.
 *  Turn off once EdgeOne resolves directories on the custom domain: GALLERY_PRETTY_LINKS=1 npm run build. */
import fs from 'node:fs'; import path from 'node:path';
const dist = path.resolve(process.argv[2] || 'dist');
if (process.env.GALLERY_PRETTY_LINKS === '1') { console.log('index-links: skipped (pretty links)'); process.exit(0); }
let files = 0, links = 0;
const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); e.isDirectory() ? walk(f) : f.endsWith('.html') && fix(f); } };
function fix(file) {
  const before = fs.readFileSync(file, 'utf8');
  let n = 0;
  let html = before.replace(/href="(\/(?:zh|en)(?:\/[^"#?]*)?\/)"/g, (_, p) => (n++, `href="${p}index.html"`));
  // the root language picker and the 404 page's inline script build their links in JS
  html = html.replaceAll(`'/zh/':'/en/'`, `'/zh/index.html':'/en/index.html'`).replaceAll('url=/zh/"', 'url=/zh/index.html"')
             .replaceAll(`'/'+lang+'/list/'`, `'/'+lang+'/list/index.html'`).replaceAll(`'/'+lang+'/'`, `'/'+lang+'/index.html'`);
  if (html !== before) { fs.writeFileSync(file, html); files++; links += n; }
}
walk(dist);
console.log(`index-links: ${links} links in ${files} pages now end in index.html`);
