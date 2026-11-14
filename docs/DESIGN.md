# 育恒的画廊 · Yu Heng's Gallery — design spec (v1)

Creative lead: Claude. This file is the visual contract. Builders implement it faithfully;
where it is silent, choose the quieter option. Screenshots are reviewed against it.

## 0. Idea in one line

The workbench is the desk (纸墨 paper & ink); the gallery is **the album the finished pages go into**.
Every work has two faces: a **catalogue card** (typed, exact: information, files) and a
**scrapbook spread** (handwritten, collaged: story, beauty). The works themselves are the collage pieces.

Restraint rules (non-negotiable):
- Handwriting only for names, notes, arrows, signature. Reading text is LXGW WenKai.
- Max three collage materials: **washi tape, photo corners, torn paper scraps**. No pins, stickers-as-decoration, emoji, gradients, glassmorphism.
- The work is always the most saturated thing on screen. UI is ink on paper.
- All randomness (tilt, offset, tape position) comes from a per-work integer `seed` → identical every build.

## 1. Tokens & type

- Import the workbench tokens verbatim: copy `/var/lib/codex-workbench/projects/workbench/design/css/tokens.css`
  (+ `design/assets/paper-day.webp`, night texture if present) via `scripts/sync-tokens.sh`. Never fork values; add
  gallery-only tokens in `gallery-tokens.css`:
  ```css
  --font-hand: "Caveat", "Long Cang", var(--font-kai);   /* Latin → Caveat, CJK → Long Cang */
  --hand-zh-scale: 1.18;      /* Long Cang reads small; apply on :lang(zh) .hand */
  --tilt-max: 1.6deg;         /* album pieces */
  --tilt-scatter: 6deg;       /* sticker scatter */
  --shadow-cut: drop-shadow(0 1px 0 rgb(41 35 31 / .10)) drop-shadow(0 10px 14px rgb(41 35 31 / .14));
  --shadow-mount: 0 1px 0 rgb(41 35 31 / .08), 0 14px 28px -12px rgb(41 35 31 / .28);
  --tape-a: rgb(196 96 61 / .30);  /* terracotta washi */
  --tape-b: rgb(60 90 140 / .22);  /* ink-blue washi  */
  ```
  Night theme: use workbench `[data-theme="night"]`; tape alpha ×0.7, shadows darker and wider, never glowing.
- Fonts, all self-hosted, OFL: LXGW WenKai (reuse the workbench's split woff2 subsets), **Long Cang** and **Caveat**
  (Google Fonts sources). Long Cang must be **subset at build time to exactly the glyphs used in content** (pyftsubset).
- Sizes: wordmark `--text-3xl`; detail title (hand) `--text-4xl`×1.1; album names (hand) 1.35rem; body `--text-lg`
  at `--leading-read`; meta `--text-xs` ink-3; file tree `--font-mono` `--text-sm`.

## 2. Global frame

- Background: `--paper` + paper texture over the whole page (as workbench). No boxed page containers.
- Header (not sticky; thin `--rule` underneath, generous padding `--s-7`):
  left **wordmark**: small square cinnabar seal (28px, `--cinnabar`, white 育恒 in WenKai, 2px inner border, rotated -3deg,
  `mix-blend-mode: multiply`) + "育恒的画廊" / "Yu Heng's Gallery" in WenKai.
  right: `画廊 · 目录` / `Gallery · Index` (current underlined with a hand-drawn ink stroke SVG), `中 / EN`, theme toggle
  (small ink sun/moon line icon). All plain text links, ink-2, hover ink.
- Footer: one quiet line, ink-3: `© 2026 育恒 · 纸墨` + GitHub link.
- Routes: `/zh/…` and `/en/…`; `/` picks by `navigator.language` (zh* → zh, else en; default zh without JS). Language
  switch keeps the same path. `hreflang` alternates. Missing translation falls back to the other language silently.

## 3. Album (home) `/zh/`

1. **Letter intro** (max 30em, `--text-lg`, ink-2), then a handwritten signature line `— 育恒 · 2026` in `--font-hand`, ink-2,
   rotated -2deg. Copy in `content/site.yaml`.
2. **Album grid**, 12 columns desktop (gap `--s-8` × `--s-9`), manual order. Size → span: `L`=6, `M`=4, `S`=3.
   Each piece gets seeded tilt (±`--tilt-max`) and seeded vertical offset (0–40px). Leave breathing room; it should feel
   laid down by hand, not packed.
3. **A piece** (`.slip`):
   - Transparent media (auto-detected at build: alpha channel with ≥2% transparent pixels) → no frame; `filter: var(--shadow-cut)`,
     sits directly on the paper.
   - Opaque media → **mount**: `--sheet-raised` mat, padding 12px (L: 16px), 1px `--rule`, `box-shadow: var(--shadow-mount)`,
     two **photo corners** (seeded: top-left+bottom-right or top-right+bottom-left).
   - One strip of **washi tape** (seeded colour a/b, position top-centre or one corner, ±8deg), only on mounts.
   - Under it: the **handwritten name** (`.hand`, ink-2, counter-tilt to the piece), then a typed meta line `2026 · 动画短片` (ink-3, xs).
   - Hover/focus: lift 3px, tilt eases halfway to 0, shadow deepens; `--dur-3 --ease-out`. Focus ring: 1.5px dashed `--accent-line`, offset 6px.
4. **Motion media** shows its still poster; plays (muted, loop) when ≥60% in view or on hover; pauses out of view.
   `prefers-reduced-motion` → never autoplay; a small hand-drawn ▷ in a circle sits on the poster, click to play.
5. **Collection** (folder) = a **stack**: its cover on top, up to two child covers behind (rotated +4deg / -3deg, offset 8px),
   name + count in hand: `章鱼小克 (24)`. Clicking fans the stack into the collection page (view transition).
6. First load only: pieces **settle** — from translateY(-8px) and +1deg extra tilt to rest, `--dur-4 --ease-spring`, stagger 40ms.
   None under reduced motion.

## 4. Index view `/zh/list/`

A book's table of contents on paper: grouped by year (year in hand font, large, ink-3), rows in WenKai:
`title ·········· medium ········ 2026`, dotted leaders, collections show children indented with a thin guide line.
Hover row → tiny thumbnail floats at cursor-right (desktop only).

## 5. Work page `/zh/works/<path…>/`

Top: **ink-trail breadcrumb** (`画廊 / 章鱼小克`) in ink-3 with hand-drawn slashes.

### 5.1 Catalogue card + hero
- Desktop ≥1100px: two columns — card (≈40%) left, **hero piece** (≈60%) right, the hero overlapping the card edge by 24px
  and taped. Below 1100: card, then hero, full width.
- **Card**: `--sheet-raised`, `--radius-xs`, 1px `--rule`, `--shadow-mount`, rotated -0.4deg, a line-drawn **paper clip**
  (SVG, ink-3) over its top-left edge. Inside:
  - Title in hand font (`--text-4xl`), other-language title below in WenKai sm ink-3.
  - Definition rows (label ink-3 xs, value ink): 年份 Year · 媒介 Medium · 工具 Tools · 规格 Spec (duration / count).
  - Summary: max two sentences.
  - `文件 Files` — a `<details>` disclosure, **closed by default**, with a hand-drawn caret. Inside, a file tree in mono:
    16px indent per level with dotted guide lines, tiny line icons (folder/video/image/archive/audio), size right-aligned ink-3.
    Row actions: `↓` download (hosted on the site), `↗` view folder on GitHub (repo tree URL of that content folder), and
    bundle rows `打包下载 .zip`. Keyboard accessible.
  - Bottom-right: cinnabar **seal stamp** with the year (e.g. `二〇二六`), rotated, multiply, 70% opacity.
- **Hero**: for the film, the actual player — poster mounted as a print, large hand-drawn ▷ circle; click → native video
  controls inside the mount. For the sticker pack, a mounted cover with 3 stickers taped loosely on its corner.

### 5.2 Collage spreads (the story)
A sequence of spreads, each a `<section>` (desktop min-height ~70vh, 12-col grid). Templates:
- `hero-note`: one big piece (span 7) + text column (span 4): paragraph in WenKai, plus a **handwritten note** on a torn
  **paper scrap** (`--well`, jagged SVG edge) with a hand-drawn **arrow** curving to the piece.
- `pair`: two pieces of different sizes, vertically offset, one taped, one cornered; caption notes in hand.
- `scatter`: 6–12 small transparent pieces scattered on a jittered grid (seeded, ±`--tilt-scatter`, slight overlaps).
  Hover/focus → piece rises above the others and plays; its name appears in hand beneath it.
- `text-margin`: centred reading column (`--read-w`) with 1–2 small pieces in the margins (desktop), taped.
Hand-drawn arrows/underlines: SVG paths with slight wobble, stroke 1.5px, round caps, `--ink-2`; notes in `--accent-ink`
or `--ink-2` (alternate by seed).

### 5.3 Lightbox
Click any piece → overlay of `--paper` at 94% + 6px backdrop blur; piece at max size with its handwritten caption;
←/→ walk the pieces in story order, Esc/click-outside closes, swipe on touch; view transition from the piece.

## 6. Phone (<720px)
- Album: 2 columns; S = 1 column, M/L = full width. Tilts halved. Header wraps to two lines (wordmark / links).
- Work page: card full width, no overlap; spreads become a vertical scrapbook: pieces full width with alternating ±12px
  offsets, notes directly under their piece, arrows hidden; scatter → 3-column jitter grid.
- Touch targets ≥44px. Nothing scrolls horizontally.

## 7. Media rules
- **Every published file < 24 MB** (EdgeOne limit is 25 MB). The build fails loudly otherwise.
- Stills: AVIF + WebP (alpha preserved) with srcset 480/960/1600; LQIP = dominant colour background.
- Animated transparent pieces (stickers): **animated WebP with full alpha** built from the PNG frame sequences (not from GIFs),
  320 and 480 widths; GIF kept only as a download.
- Film: full film MP4 H.264 720p, faststart, ≤ 22 MB (2-pass); a 6 s muted loop (480px, MP4 + WebM) for the album slip; poster AVIF/WebP.
- Alt text zh/en for every piece. Handwritten text is real text, never baked into images.

## 8. Copy (v1 — short on purpose, editable in the console later)
- Site intro zh: 「这里收着我做过的东西：画、动画、一些小玩意儿。一页一页，慢慢翻。」
  en: "Things I've made — drawings, animations, small experiments. Turn the pages slowly."
- **一点火花 / A Little Spark** — 2026 · 手绘风格动画短片 · 60 秒 / hand-drawn-style animated short · 60 s.
  Summary zh: 「一只小章鱼，在纸上找到了一点火花。」 en: "A small octopus finds a spark on paper."
  Tools: Python · Skia · numpy. Story notes (hand): 「每一帧都是代码画的」 "every frame drawn in code";
  「配乐也是算出来的」 "the music is computed too"; 「96 bpm」.
- **章鱼小克 / Little Ke** — 2026 · 动态表情 · 24 枚 / animated stickers · 24.
  Summary zh: 「从短片里走出来的小章鱼，被剪成了 24 张会动的纸片。」 en: "The octopus from the film, cut out of paper into 24 moving stickers."
  Notes: 「剪刀留下的奶油色毛边」 "the cream edge is the scissor cut"; 「早安到晚安」 "from good morning to good night".
