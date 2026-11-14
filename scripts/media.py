#!/usr/bin/env python3
"""Reproducible masters → derivatives; never use GIFs as animation inputs.

Run with .venv/bin/python scripts/media.py. Set GALLERY_MASTERS to relocate masters.
Cached jobs include input SHA-256 and encoder arguments, so reruns are idempotent.
"""
import ast
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/var/lib/claude-isolated/workbench')
MASTERS = Path(os.environ.get('GALLERY_MASTERS', '/var/lib/codex-workbench/gallery/masters'))
SHOTS = Path(os.environ.get('GALLERY_SHOTS', str(SOURCE / 'gallery-design/shots/A')))
CACHE = ROOT / '.cache/media'
CACHE.mkdir(parents=True, exist_ok=True)
LIMIT = 24_000_000
FFMPEG = shutil.which('ffmpeg')

def call(args):
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)

def copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or source.stat().st_mtime_ns != target.stat().st_mtime_ns or source.stat().st_size != target.stat().st_size:
        shutil.copy2(source, target)

def job(key, sources, outputs, fn):
    signature = hashlib.sha256(key.encode())
    for src in sources:
        signature.update(src.read_bytes())
    stamp = CACHE / (hashlib.sha256(key.encode()).hexdigest() + '.json')
    fingerprint = signature.hexdigest()
    if stamp.exists() and json.loads(stamp.read_text()) == fingerprint and all(p.exists() for p in outputs):
        return
    for target in outputs:
        target.parent.mkdir(parents=True, exist_ok=True)
    fn()
    for target in outputs:
        if target.stat().st_size >= LIMIT:
            raise ValueError(f'File exceeds strict 24 MB limit: {target}')
    stamp.write_text(json.dumps(fingerprint))
    print(key, flush=True)

def still(src, base):
    outputs = [base.with_name(f'{base.name}-{w}.{ext}') for w in (480, 960, 1600) for ext in ('webp', 'avif')]
    def encode():
        with Image.open(src) as img:
            img = img.convert('RGBA')
            for width in (480, 960, 1600):
                size = (width, round(img.height * width / img.width))
                resized = img.resize(size, Image.Resampling.LANCZOS)
                for ext in ('webp', 'avif'):
                    resized.save(base.with_name(f'{base.name}-{width}.{ext}'), quality=82 if ext == 'webp' else 62)
    job(f'still-v1-{base}', [src], outputs, encode)

def main():
    film = MASTERS / 'a-little-spark'
    stickers = MASTERS / 'little-ke'
    for name in ('a-little-spark.mp4', 'poster.png'):
        copy(SOURCE / 'claude-film/out' / name, film / name)
    registry = ast.parse((SOURCE / 'claude-stickers/src/stickers/__init__.py').read_text())
    order = next(ast.literal_eval(n.value) for n in registry.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'ORDER' for t in n.targets))
    sticker_source = ast.parse((SOURCE / 'claude-stickers/src/sticker.py').read_text())
    fps = next(ast.literal_eval(n.value) for n in sticker_source.body if isinstance(n, ast.Assign) and any(getattr(t, 'id', '') == 'FPS' for t in n.targets))
    copy(SOURCE / 'claude-stickers/src/sticker.py', stickers / 'source/sticker.py')
    copy(SOURCE / 'claude-stickers/src/stickers/__init__.py', stickers / 'source/order.py')
    for sid in order:
        for frame in sorted((SOURCE / f'claude-stickers/frames/{sid}/480').glob('*.png')):
            copy(frame, stickers / 'frames' / sid / frame.name)
    for gif in sorted((SOURCE / 'claude-stickers/out/package/hd').glob('*.gif')):
        copy(gif, stickers / 'hd' / gif.name)
    for name in ('cover.png', 'banner.png'):
        copy(SOURCE / 'claude-stickers/art' / name, stickers / name)
    media = ROOT / 'content/works/a-little-spark/media'
    files = media.parent / 'files'
    media.mkdir(parents=True, exist_ok=True)
    files.mkdir(exist_ok=True)
    SHOTS.mkdir(parents=True, exist_ok=True)
    contact = SHOTS / 'film-contact-sheet.png'
    def sheet():
        thumbs = []
        for sec in range(0, 60, 5):
            target = CACHE / f'contact-{sec}.png'
            call(['-ss', sec, '-i', film / 'a-little-spark.mp4', '-vf', 'scale=384:-1', '-frames:v', 1, target])
            with Image.open(target) as image:
                thumb = Image.new('RGB', (384, 244), '#f6f0e5')
                thumb.paste(image, (0, 0))
                ImageDraw.Draw(thumb).text((12, 224), f'{sec:02d} seconds', fill='#29231f')
                thumbs.append(thumb)
        out = Image.new('RGB', (1536, 732), '#f6f0e5')
        for n, thumb in enumerate(thumbs): out.paste(thumb, ((n % 4) * 384, (n // 4) * 244))
        out.save(contact)
    job('contact-v2', [film / 'a-little-spark.mp4'], [contact], sheet)
    # A2: the 44s garden has no lettering. A 16:9 crop places Little Ke to the
    # right, leaving the 40%/58% play mark clear of its face even on phones.
    poster = CACHE / 'poster-garden-44.png'
    job('poster-garden-44-crop-v1', [film / 'a-little-spark.mp4'], [poster],
        lambda: call(['-ss', '44', '-i', film / 'a-little-spark.mp4', '-vf', 'crop=1600:900:0:0', '-frames:v', 1, poster]))
    still(poster, media / 'poster')
    # Selected against the contact sheet: discovery, movement, encounter, ensemble, closing light.
    selection = [12, 25, 35, 45, 57]
    for n, sec in enumerate(selection, 1):
        raw = CACHE / f'still-{sec}.png'
        job(f'extract-{sec}', [film / 'a-little-spark.mp4'], [raw], lambda s=sec, r=raw: call(['-ss', s, '-i', film / 'a-little-spark.mp4', '-frames:v', 1, r]))
        still(raw, media / f'story-{n}')
    (SHOTS / 'film-selection.json').write_text(json.dumps({'seconds': selection, 'contactSheet': 'film-contact-sheet.png'}, indent=2) + '\n')
    download = files / 'a-little-spark-720p.mp4'
    def full_film():
        with tempfile.TemporaryDirectory() as tmp:
            base = ['-i', film / 'a-little-spark.mp4', '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'medium', '-b:v', '2000k', '-pix_fmt', 'yuv420p', '-threads', '2', '-passlogfile', Path(tmp) / 'film']
            call([*base, '-pass', '1', '-an', '-f', 'null', '/dev/null'])
            call([*base, '-pass', '2', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', download])
        if download.stat().st_size > 22_000_000: raise ValueError('Film over 22 MB')
    job('film-720p-2pass-v1', [film / 'a-little-spark.mp4'], [download], full_film)
    for ext in ('mp4', 'webm'):
        loop = media / f'loop.{ext}'
        codec = ['-c:v', 'libx264', '-crf', '25', '-movflags', '+faststart'] if ext == 'mp4' else ['-c:v', 'libvpx-vp9', '-crf', '35', '-b:v', '0']
        job(f'loop-v1-{ext}', [film / 'a-little-spark.mp4'], [loop], lambda o=loop, c=codec: call(['-ss', '16', '-i', film / 'a-little-spark.mp4', '-t', '6', '-an', '-vf', 'scale=480:-2', '-threads', '2', *c, o]))
    smedia = ROOT / 'content/works/little-ke/media'
    smedia.mkdir(parents=True, exist_ok=True)
    for name in ('cover', 'banner'): still(stickers / f'{name}.png', smedia / name)
    def animate(sid):
        frames = sorted((stickers / 'frames' / sid).glob('*.png'))
        still(frames[0], smedia / sid)
        for width in (320, 480):
            dest = smedia / f'{sid}-animated-{width}.webp'
            def encode(w=width, out=dest):
                images = []
                for frame in frames:
                    with Image.open(frame) as im:
                        images.append(im.convert('RGBA').resize((w, w), Image.Resampling.LANCZOS))
                images[0].save(out, save_all=True, append_images=images[1:], duration=round(1000 / fps), loop=0, quality=80, method=4, allow_mixed=True)
            job(f'animated-v1-{sid}-{width}-{fps}', frames, [dest], encode)
        print(f'{sid}: {len(frames)} frames @ {fps} fps', flush=True)
    with ThreadPoolExecutor(max_workers=2) as pool: list(pool.map(animate, order))
    destfiles = smedia.parent / 'files'
    for gif in sorted((stickers / 'hd').glob('*.gif')): copy(gif, destfiles / 'stickers' / gif.name)
    bundle = destfiles / 'stickers.zip'
    gifs = sorted((destfiles / 'stickers').glob('*.gif'))
    def archive():
        with zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for gif in gifs:
                info = zipfile.ZipInfo(f'stickers/{gif.name}', date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                z.writestr(info, gif.read_bytes())
        if bundle.stat().st_size >= LIMIT: bundle.unlink()
    bundle_stamp = CACHE / (hashlib.sha256(b'bundle-v1').hexdigest() + '.json')
    if not bundle.exists() and bundle_stamp.exists(): bundle_stamp.unlink()
    job('bundle-v1', gifs, [], archive)
    for path in (ROOT / 'content').rglob('*'):
        if path.is_file() and path.stat().st_size >= LIMIT: raise ValueError(f'File ≥24 MB: {path}')
    print('All published media <24 MB; animation source fps:', fps)

if __name__ == '__main__': main()
