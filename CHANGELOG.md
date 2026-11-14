# Changelog

## [Unreleased]

### 2026-11-14 · Handle cancelled lightbox view transitions before first publish (agent: Codex, requested by: owner)

- Catch rejected ready/finished promises when Chrome cancels a lightbox transition because its viewport changes or the dialog closes quickly. Keep the original lightbox, focus and motion behavior.
- Found during protected live-preview acceptance before the first remote push. Validate with rapid open/close and the final live 1440/390 day/night matrix. No deployment trigger or history rewrite.

### 2026-11-14 · Prepare C2 first Git-integrated cloud build (agent: Codex, requested by: owner)

- Keep original main README byte-for-byte; retain the gallery implementation guide in docs/site-build.md. Add explicit EdgeOne npm/install/output and Node 22.23.4 configuration.
- Bundle deterministic subset/full WOFF2 fonts so a fresh cloud build has no uv, Python install or server-loopback proxy dependency. Publisher keeps its verified local Python build cache. No visual/layout changes.
- Verification: fresh unprivileged npm ci/build with no .venv passed: 9 pages, 390 output files, strict 24 MB checks. First remote write will be the Owner-confirmed publisher's one-commit/one-tag bootstrap; no manual push.
- Rollback: future separately authorized restoring publish; preserve history, content and masters.

### 2026-11-14 · Apply the lead's A2 gallery polish (agent: Codex, requested by: owner)

- Make the header seal 34px with upright right-to-left columns, white lettering and a 1.5px border inset 3px. Enlarge the year seal to 52px at 65% by day; both seals use normal blending at 92% at night. Restore full day tape alpha at night.
- Balance the bilingual intro at a desktop maximum of 34em. Use a text-free 44-second flower-garden poster, reframed to 16:9 so the 40%/58% play circle clears Little Ke's face; regenerate all six AVIF/WebP poster derivatives through `scripts/media.py`.
- Tighten the opening hero-note gap, centre the note against the print, and derive the curved arrow and inward arrowhead from the rotated scrap/print edges, updating on layout changes. Add seeded ±28px/±36px scatter offsets, ±6° tilt and 0.9–1.08 scale; constrain neighbouring overlap to 8% and retain four/three columns without clipping.
- Verification: production build (nine routes, 390 files strictly below 24 MB), TypeScript, and 298 passed Chrome assertions covering the complete interaction matrix and A2 geometry at 1440×900 / 390×844, day/night. Only the 14 requested affected screenshots are written to `gallery-design/shots/A2/`; evidence and rerun commands are in the A2 section of `gallery-design/reports/A.md`.
- Local commit on `gallery-v1` only; no push, deployment or service change. Rollback: revert this A2 commit, retaining review evidence.

### 2026-11-14 · Build the bilingual paper album gallery (agent: Codex, requested by: owner)

- Implement the creative lead's paper-and-ink design: letter, seeded album pieces, collection stacks, catalogue cards, file trees, four collage spreads and a story-order lightbox. Add Chinese/English routes, day/night themes, phone layouts, deliberate playback under reduced motion, keyboard/touch controls and shared-cover view transitions.
- Publish-ready local content contains exactly two works: A Little Spark and Little Ke. The latter has two scatter spreads of 12 stickers. An opt-in fixture separately proves two levels of collection nesting, stacked covers and breadcrumbs.
- Import workbench tokens verbatim and self-host OFL fonts. Subset handwriting fonts at build. Generate AVIF/WebP stills, full-alpha animated WebP directly from PNG frames at 12.5 fps, a two-pass 720p movie, album loops, 24 GIF downloads and a ZIP. Private masters remain outside the repository.
- Verification: production and fixture static builds; TypeScript; 24 MB boundary rejection; SHA-256 media idempotence; animation alpha/frame timing; ZIP integrity; four Chrome width/theme runs (242 assertions) and 68 screenshots. Detailed evidence is in `/var/lib/claude-isolated/workbench/gallery-design/shots/A/` and the handoff report in `gallery-design/reports/A.md`.
- No push, deployment, service or workbench source change. The local work is on `gallery-v1`. Rollback is switching to the original `main` branch; retain external masters and evidence.
