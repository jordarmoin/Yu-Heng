#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
source_dir=${WORKBENCH_DESIGN:-/var/lib/codex-workbench/projects/workbench/design}
mkdir -p "$root/site/public/design/css" "$root/site/public/design/assets" "$root/site/public/fonts"
cp "$source_dir/css/tokens.css" "$root/site/public/design/css/tokens.css"
cp "$source_dir/assets/paper-day.webp" "$root/site/public/design/assets/"
if [ -f "$source_dir/assets/paper-night.webp" ]; then cp "$source_dir/assets/paper-night.webp" "$root/site/public/design/assets/"; fi
# CSS custom-property URLs resolve where they are used (Astro emits /_astro/*.css).
mkdir -p "$root/site/public/assets"
cp "$root/site/public/design/assets/"*.webp "$root/site/public/assets/"
cp -R "$source_dir/fonts/lxgw-wenkai" "$root/site/public/fonts/"
