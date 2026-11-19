/** Explicit local maintenance command (never run by the cloud build): pre-render the sharing cards and icons.
 *  npm run brand  →  site/public/og/{home,<work>}.png (1200×630), favicon-32.png, apple-touch-icon.png
 *  Chrome talks over a pipe and every request is answered from site/public, so no port is opened.
 *  Seals come from site/public/brand (carved by gallery-design/ops/seals.py). */
import fs from 'node:fs'; import path from 'node:path';
import sharp from 'sharp'; import puppeteer from 'puppeteer-core'; import { parse } from 'yaml';

const root = process.cwd(), pub = path.join(root, 'site/public'), ORIGIN = 'https://brand.local';
const types = { '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const site = parse(fs.readFileSync('content/site.yaml', 'utf8'));
const works = fs.readdirSync('content/works').filter(id => fs.existsSync(`content/works/${id}/item.yaml`))
  .map(id => ({ id, ...parse(fs.readFileSync(`content/works/${id}/item.yaml`, 'utf8')) }))
  .filter(w => w.status === 'published').sort((a, b) => a.order - b.order);
const esc = s => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const media = (w, p) => `/content/works/${w.id}/${p}`;
const big = p => p.replace(/-(480|960)\.webp$/, '-1600.webp');
const transparent = w => w.spreads?.some(s => s.template === 'scatter');
const friends = w => (w.spreads || []).filter(s => s.template === 'scatter').flatMap(s => s.pieces).map(p => p.poster || p.src);
const tape = (cls = '') => `<svg class="tape ${cls}" viewBox="0 0 114 32"><polygon points="0,2 8,3 16,0 24,3 32,1 40,3 48,0 56,2 64,0 72,2 80,1 88,3 96,0 104,2 113,1 112,30 104,28 96,31 88,29 80,31 72,28 64,30 56,29 48,31 40,28 32,30 24,28 16,31 8,29 0,30" fill="currentColor"/></svg>`;
const print = (src, cls) => `<div class="print ${cls}"><img src="${src}"/>${tape()}</div>`;
const cutout = (src, cls) => `<img class="cutout ${cls}" src="${src}"/>`;

const css = `
@font-face{font-family:'Long Cang';src:url('/fonts/long-cang-subset.woff2')}
@font-face{font-family:Caveat;src:url('/fonts/caveat-subset.woff2')}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px}
body{position:relative;overflow:hidden;background:var(--paper) url('/assets/paper-day.webp') repeat;background-size:320px;color:var(--ink);font-family:'LXGW WenKai',serif}
.copy{position:absolute;left:72px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center}
.title{display:flex;align-items:center;gap:22px}
h1{font:400 84px/1.1 'Long Cang',serif;margin:0;white-space:nowrap}
.seal{width:36px;height:60px;transform:rotate(-3deg);mix-blend-mode:multiply}
.english{font:400 46px/1.1 Caveat,cursive;color:var(--ink-2);margin:10px 0 0 4px}
.line{font-size:25px;line-height:1.7;margin:38px 0 0;color:var(--ink);max-width:440px;text-wrap:balance}
.brand{position:absolute;left:72px;bottom:46px;font-size:19px;color:var(--ink-3);letter-spacing:.06em}
.rule{position:absolute;left:72px;right:72px;bottom:96px;height:1px;background:var(--rule)}
.print{position:absolute;padding:16px;background:var(--sheet-raised);border:1px solid var(--rule);box-shadow:0 1px 0 rgb(41 35 31/.08),0 22px 40px -16px rgb(41 35 31/.38)}
.print img{display:block;width:100%}
.tape{position:absolute;top:-15px;left:58%;width:120px;height:32px;color:rgb(196 96 61/.32);transform:rotate(-6deg)}
.cutout{position:absolute;filter:drop-shadow(0 1px 0 rgb(41 35 31/.1)) drop-shadow(0 12px 16px rgb(41 35 31/.18))}
.p-home{width:520px;right:58px;top:84px;transform:rotate(2.2deg)}
.c-home{width:230px;right:400px;top:336px;transform:rotate(-8deg)}
.p-film{width:600px;right:60px;top:112px;transform:rotate(1.6deg)}
.c-main{width:390px;right:140px;top:110px;transform:rotate(-3deg)}
.c-f0{width:200px;right:450px;top:320px;transform:rotate(-12deg)}
.c-f1{width:190px;right:44px;top:56px;transform:rotate(10deg)}`;

const card = (w) => {
  const seal = `<img class="seal" src="/brand/seal-name.svg"/>`;
  if (!w) {
    const film = works.find(x => !transparent(x)), set = works.find(transparent);
    const intro = site.intro.zh.split(/(?<=。)/).filter(Boolean).at(-1);
    return `<div class="copy"><div class="title"><h1>育恒的画廊</h1>${seal}</div><p class="english">Yu Heng's Gallery</p><p class="line">${esc(intro)}</p></div>
      <div class="rule"></div><p class="brand">gallery.zyhzyh.me</p>
      ${film ? print(media(film, big(film.cover.poster || film.cover.src)), 'p-home') : ''}${set ? cutout(media(set, big(set.cover.src)), 'c-home') : ''}`;
  }
  const stickers = friends(w);
  // Vol. 2 already uses its first sticker as the Hero pose.
  const firstFriend = w.id === 'little-ke-2' ? stickers[1] : stickers[0];
  const art = transparent(w)
    ? cutout(media(w, big(firstFriend)), 'c-f0') + cutout(media(w, big(stickers.at(-1))), 'c-f1') + cutout(media(w, big(w.cover.src)), 'c-main')
    : print(media(w, big(w.hero.poster || w.cover.src)), 'p-film');
  return `<div class="copy"><div class="title"><h1>${esc(w.title.zh)}</h1></div><p class="english">${esc(w.title.en)}</p><p class="line">${esc(w.summary.zh)}</p></div>
    <div class="rule"></div><p class="brand">育恒的画廊 · Yu Heng's Gallery</p>${art}`;
};

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, pipe: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--no-proxy-server', '--font-render-hinting=none'] });
fs.mkdirSync(path.join(pub, 'og'), { recursive: true });
try {
  for (const w of [null, ...works]) {
    const name = w?.id || 'home';
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setRequestInterception(true);
    page.on('request', r => {
      const u = new URL(r.url());
      if (u.origin !== ORIGIN) return r.respond({ status: 404, body: '' });
      if (u.pathname === '/') return r.respond({ status: 200, contentType: 'text/html', body: `<!doctype html><html lang="zh"><head><meta charset="utf-8"><link rel="stylesheet" href="/design/css/tokens.css"><link rel="stylesheet" href="/fonts/lxgw-wenkai/lxgwwenkai-regular.css"><style>${css}</style></head><body>${card(w)}</body></html>` });
      const f = path.resolve(pub, '.' + decodeURIComponent(u.pathname));
      if (!f.startsWith(pub + '/') || !fs.existsSync(f) || !fs.statSync(f).isFile()) return r.respond({ status: 404, body: '' });
      r.respond({ status: 200, contentType: types[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
    });
    await page.goto(ORIGIN + '/', { waitUntil: 'networkidle0' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      if (![...document.fonts].some(f => f.family === 'Caveat' && f.status === 'loaded')) throw Error('Hand fonts not loaded');
      await Promise.all([...document.images].map(i => i.decode()));
    });
    if (w) await page.evaluate(() => {
      const title = document.querySelector('h1');
      const available = title.parentElement.clientWidth;
      const width = title.getBoundingClientRect().width;
      if (width > available) {
        const fontSize = parseFloat(getComputedStyle(title).fontSize);
        title.style.fontSize = `${fontSize * (available - 2) / width}px`;
      }
    });
    await page.screenshot({ path: path.join(pub, 'og', name + '.png') });
    await page.close(); console.log('Rendered', name, '1200x630');
  }
  // Icons: the vertical name seal on a paper tile (touch) and on transparency (tab).
  const seal = fs.readFileSync(path.join(pub, 'brand/seal-name.svg'));
  const tall = await sharp(seal, { density: 600 }).resize({ height: 136 }).png().toBuffer();
  const { width } = await sharp(tall).metadata();
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#f6f0e5' } })
    .composite([{ input: tall, left: Math.round((180 - width) / 2), top: 22 }]).png().toFile(path.join(pub, 'apple-touch-icon.png'));
  await sharp(fs.readFileSync(path.join(pub, 'seal.svg')), { density: 300 }).resize(32, 32).png().toFile(path.join(pub, 'favicon-32.png'));
  console.log('Rendered icons');
} finally { await browser.close(); }
