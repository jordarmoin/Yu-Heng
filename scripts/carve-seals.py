"""Carve the gallery's seals as self-contained SVGs (glyph outlines baked in; no web font needed).

usage: python3 scripts/carve-seals.py site/public   (needs fonttools + brotli; local maintenance only, output is committed)
  brand/seal-name.svg   vertical 白文 name seal 育/恒 (white characters cut into cinnabar)  — header, favicon
  brand/seal-year-YYYY.svg square 朱文 year seal 二〇 / 二六 (cinnabar characters and rim)      — catalogue card
  seal.svg              favicon: the name seal centred on a square canvas
Everything is seeded, so every run produces identical files.
"""
import math, random, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

PUB = Path(sys.argv[1]).resolve()
FONTS = PUB / 'fonts/lxgw-wenkai/files'
SUBSET = {'育': 116, '恒': 111, '二': 117, '〇': 86, '六': 115}
CINNABAR = '#b53f2c'


def glyph(ch, box, natural=False):
    """SVG path for `ch` in box = (x, y, w, h), y down. natural=True keeps the font's em proportions
    (glyph centred in its em square); otherwise the glyph's own bounds are fitted to the box."""
    font = TTFont(FONTS / f'lxgwwenkai-regular-subset-{SUBSET[ch]}.woff2')
    gs = font.getGlyphSet()
    name = font.getBestCmap()[ord(ch)]
    from fontTools.pens.boundsPen import BoundsPen
    bp = BoundsPen(gs); gs[name].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    bx, by, bw, bh = box
    if natural:
        em = font['head'].unitsPerEm; s = min(bw, bh) / em
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2          # centre the ink, size by em
        ox = bx + bw / 2 - cx * s; oy = by + bh / 2 + cy * s
    else:
        s = min(bw / (x1 - x0), bh / (y1 - y0))
        ox = bx + (bw - (x1 - x0) * s) / 2 - x0 * s
        oy = by + (bh - (y1 - y0) * s) / 2 + y1 * s
    pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    gs[name].draw(TransformPen(pen, (s, 0, 0, -s, ox, oy)))
    return pen.getCommands()


def rough_rect(rng, x, y, w, h, amp, step=1.2, chips=3):
    """A rectangle whose edges wander gently (low-frequency noise) with a few small chips, like a pressed seal."""
    per = 2 * (w + h)
    waves = [(rng.uniform(40, 70), rng.uniform(0, 6.3), .6), (rng.uniform(13, 21), rng.uniform(0, 6.3), .28), (rng.uniform(4, 6), rng.uniform(0, 6.3), .12)]
    nicks = [(rng.uniform(0, per), rng.uniform(1.2, 2.6), rng.uniform(.8, 1.6)) for _ in range(chips)]
    def off(t):
        d = sum(a * math.sin(2 * math.pi * t / lam + ph) for lam, ph, a in waves) * amp
        for c, width, depth in nicks:
            u = abs(t - c)
            if u < width: d -= depth * amp * (1 - u / width) ** 2 * 1.8
        return d
    pts, t0 = [], 0.0
    for (ax, ay, bx, by) in ((x, y, x + w, y), (x + w, y, x + w, y + h), (x + w, y + h, x, y + h), (x, y + h, x, y)):
        L = math.hypot(bx - ax, by - ay); n = max(2, int(L / step))
        nx, ny = (by - ay) / L, -(bx - ax) / L          # outward normal (clockwise path)
        for i in range(n):
            t = i / n; d = off(t0 + L * t)
            pts.append((ax + (bx - ax) * t + nx * d, ay + (by - ay) * t + ny * d))
        t0 += L
    return 'M' + ' L'.join(f'{px:.2f} {py:.2f}' for px, py in pts) + ' Z'


def wear(rng, x, y, w, h, n, rmax):
    """Small specks where the ink did not take."""
    out = []
    for _ in range(n):
        r = rmax * (.3 + rng.random() * .7)
        out.append(f'<circle cx="{x + rng.random() * w:.2f}" cy="{y + rng.random() * h:.2f}" r="{r:.2f}"/>')
    return ''.join(out)


def name_seal(rng):
    W, H = 60, 100
    body = rough_rect(rng, 3, 3, W - 6, H - 6, .55, chips=4)
    chars = glyph('育', (11, 11, 38, 38)) + ' ' + glyph('恒', (11, 52, 38, 38))
    return W, H, f'''<defs><mask id="cut" maskUnits="userSpaceOnUse">
  <rect width="{W}" height="{H}" fill="#fff"/>
  <path d="{chars}" fill="#000" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="{rough_rect(rng, 7, 7, W - 14, H - 14, .35, chips=2)}" fill="none" stroke="#000" stroke-width="1.5"/>
  <g fill="#000">{wear(rng, 4, 4, W - 8, H - 8, 16, .6)}</g>
 </mask></defs>
 <path d="{body}" fill="{CINNABAR}" mask="url(#cut)"/>'''


def year_seal(rng):
    W = H = 100
    rim = rough_rect(rng, 6, 6, 88, 88, .55, chips=4)
    inner = rough_rect(rng, 10.5, 10.5, 79, 79, .35, chips=2)
    cell = 40
    # rows, read left to right like the site's text: 二〇 / 二六
    chars = ' '.join([glyph('二', (11, 11, cell, cell), True), glyph('〇', (49, 11, cell, cell), True),
                      glyph('二', (11, 49, cell, cell), True), glyph('六', (49, 49, cell, cell), True)])
    return W, H, f'''<defs><mask id="wear" maskUnits="userSpaceOnUse"><rect width="{W}" height="{H}" fill="#fff"/>
  <g fill="#000">{wear(rng, 5, 5, 90, 90, 22, .8)}</g></mask></defs>
 <g mask="url(#wear)" fill="{CINNABAR}">
  <path d="{rim} {inner}" fill-rule="evenodd"/>
  <path d="{chars}" stroke="{CINNABAR}" stroke-width="1.9" stroke-linejoin="round"/>
 </g>'''


def svg(W, H, inner, label, canvas=None):
    vw, vh = canvas or (W, H)
    dx, dy = (vw - W) / 2, (vh - H) / 2
    g = f'<g transform="translate({dx:.2f} {dy:.2f})">{inner}</g>' if canvas else inner
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" role="img" aria-label="{label}">'
            f'<title>{label}</title>{g}</svg>\n')


(PUB / 'brand').mkdir(exist_ok=True)
W, H, inner = name_seal(random.Random(1987))
(PUB / 'brand/seal-name.svg').write_text(svg(W, H, inner, '育恒'))
(PUB / 'seal.svg').write_text(svg(W, H, inner, '育恒的画廊', canvas=(100, 100)))
W, H, inner = year_seal(random.Random(2026))
(PUB / 'brand/seal-year-2026.svg').write_text(svg(W, H, inner, '二〇二六'))
print('seals written to', PUB)
