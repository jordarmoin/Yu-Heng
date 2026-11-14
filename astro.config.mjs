import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  site: 'https://gallery.zyhzyh.me',
  root: fileURLToPath(new URL('./site/', import.meta.url)),
  srcDir: fileURLToPath(new URL('./site/src/', import.meta.url)),
  publicDir: fileURLToPath(new URL('./site/public/', import.meta.url)),
  outDir: fileURLToPath(new URL(`./${process.env.GALLERY_OUTDIR || 'dist'}/`, import.meta.url)),
  output: 'static', trailingSlash: 'always',
});
