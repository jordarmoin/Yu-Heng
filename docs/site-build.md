# 育恒的画廊 · Yu Heng's Gallery

A static Astro paper album. Content is editable YAML; all public media is generated from private masters. Two real works ship: **一点火花 / A Little Spark** and **章鱼小克 / Little Ke**. The sticker pack is a work with two twelve-piece scatter spreads.

## Run locally

Prerequisites: Node **22.23.4+**, npm 9.6.5+, Python 3 and `uv` (for the build-time FontTools environment on a clean checkout). Astro **7.4.12** is the stable npm release verified on 2026-11-14. No UI framework.

```bash
export HTTPS_PROXY=http://127.0.0.1:18890
export HTTP_PROXY=http://127.0.0.1:18890
npm ci
npm run build             # static output → dist/; strict file-size checks
npm run dev -- --port 4388
npm run preview -- --port 4388
```

No script pushes or deploys. Astro 7's preview runs a background local server; stop it with `npm exec astro -- preview stop`.

## Content

`content/site.yaml` holds the introductory letter, signature and GitHub link. `content/works/<path>/item.yaml` follows [docs/CONTRACT.md](docs/CONTRACT.md), reproduced unchanged from the creative lead. A child folder with its own `item.yaml` is a nested work or collection. Drafts and their descendants have no pages. Missing translations fall back to the other language.

`media/` contains web derivatives; `files/` contains downloads. YAML media paths are relative to the item's folder, except explicit `/content/…` URLs. Unknown keys are ignored. The four spread templates are `hero-note`, `pair`, `scatter`, `text-margin`. Intrinsic dimensions, exact alpha coverage (≥2% nonopaque pixels) and dominant colours are computed during build.

Preparation copies content into an ignored public staging directory, subsets Caveat and Long Cang to the content/UI character set with FontTools, then Astro builds `/zh/` and `/en/`. The size guard checks content and every published output: **24,000,000 bytes or larger fails**. Production contains exactly two top-level works.

## Media pipeline

```bash
uv pip install --python .venv/bin/python -r requirements.txt
npm run sync-tokens
npm run media
```

`scripts/sync-tokens.sh` imports workbench token CSS verbatim, both paper textures and WenKai's WOFF2 subsets. Root `/assets/` texture copies support custom-property URL resolution inside bundled CSS. `WORKBENCH_DESIGN` can point to another checkout's design folder.

`scripts/media.py` copies sources into `/var/lib/codex-workbench/gallery/masters/`, outside the repository (`GALLERY_MASTERS` overrides this). It reads the original registry order and FPS: 24 stickers at 12.5 fps. PNG sequences produce full-alpha 320/480 animated WebP; GIFs are download-only. Stills have 480/960/1600 WebP + AVIF variants. The film is two-pass H.264 1280×720, AAC audio, faststart, with a 22 MB ceiling. A separate muted 6-second 480px loop has MP4 and WebM versions. ZIP member paths and timestamps are fixed.

SHA-256 fingerprints skip unchanged encodes. Film stills are at 12, 25, 35, 45 and 57 seconds. The labelled contact sheet and selection JSON go to the lead's shots directory (`GALLERY_SHOTS` overrides it). Masters never enter `dist/`.

## Fixture and browser verification

```bash
GALLERY_FIXTURE=1 GALLERY_OUTDIR=.cache/fixture-dist npm run build
npm run qa
npm run build # restore production staging; fixtures excluded by default
```

`fixtures/works/` proves collection → collection → work, stacked covers, nested index rows and four breadcrumb levels; a hidden draft is included. It is only copied for `GALLERY_FIXTURE=1`. `GALLERY_OUTDIR` selects an isolated output folder.

`scripts/qa.mjs` starts and closes local static servers and Chrome, checks 1440×900 / 390×844 in day and night, then saves screenshots and JSON. Checks include overflow, dimensions, themes, language routes, files, film playback, arrow keys, focus restoration, hover and reduced motion. `QA_BASE` / `QA_FIXTURE_BASE` target existing previews. The default evidence directory is `/var/lib/claude-isolated/workbench/gallery-design/shots/A/`.

Native dialog provides focus trapping and Escape; arrows and touch swipes follow story order. Reduced motion has explicit play controls. Astro client navigation preserves the current work when switching language and animates shared covers; child covers fan into collection contents.

## Fonts and design

WenKai is reused from the workbench. Caveat and Long Cang are from Google Fonts' official OFL repositories. Upstream TTFs and licenses live in `scripts/fonts/`; only generated WOFF2 handwriting subsets are published. WenKai's original split WOFF2/CSS and OFL live under `site/public/fonts/lxgw-wenkai/`.

The unchanged visual contract is in [docs/DESIGN.md](docs/DESIGN.md). Gallery additions are in `site/src/styles/gallery-tokens.css`; shared values remain in the copied workbench tokens.
