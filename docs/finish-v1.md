# Local finishing candidate

Canonical origin: https://gallery.zyhzyh.me. Node22.11.0; npm ci --engine-strict && npm run build. No cloud Python/browser execution. OG/icon PNGs are committed source assets. Optional local regeneration: npm run brand (installed Chrome or CHROME_PATH); inspect outputs before committing.

EdgeOne automatically recognizes dist/404.html for SSG misses and returns it at the original URL with status404, per https://edgeone.ai/document/192123212580007936. No catch-all rewrite/redirect is added, so real routes remain real and errors remain404. Prefix /en selects English; /zh and unknown prefixes default Chinese. Dedicated /zh/404/ and /en/404/ are preview routes with noindex, excluded from sitemap.

Font maintenance: existing scripts/subset-fonts.py may be run offline with fontTools against prepared .cache/font-text.json; refresh scripts/fonts/prebuilt/*-subset.woff2 and text.sha256 together. npm run build uses only committed prebuilt WOFF2; the full-font fallback still preserves future new characters.

Review evidence is gallery-design/shots/E and reports/E.md. This branch is local only and requires lead review plus separately authorized publisher action. Do not push it manually or trigger a deployment.
