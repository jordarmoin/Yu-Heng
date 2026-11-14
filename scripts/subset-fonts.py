"""Build exactly the content/UI glyph set, with no external font requests."""
from pathlib import Path
import json
import subprocess
import sys
ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / '.cache/font-text.json').read_text())
text = ''.join(sorted(set(data)))
glyphs = ROOT / '.cache/glyphs.txt'
glyphs.write_text(text)
for name, source in [('long-cang', 'LongCang-Regular.ttf'), ('caveat', 'Caveat.ttf')]:
    subprocess.run([sys.executable, '-m', 'fontTools.subset', str(ROOT / 'scripts/fonts' / source), f'--text-file={glyphs}', '--flavor=woff2', f'--output-file={ROOT}/site/public/fonts/{name}-subset.woff2'], check=True)
print(f'Self-hosted handwritten fonts: {len(text)} unique content/UI glyphs')
