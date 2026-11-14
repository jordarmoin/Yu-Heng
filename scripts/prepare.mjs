import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { checkFiles } from './check-files.mjs';
const root = process.cwd();
checkFiles('content');
fs.mkdirSync('.cache', {recursive:true});
fs.mkdirSync('site/public/content', {recursive:true});
// Remove only generated copies so deleted drafts cannot leak into a later build.
fs.rmSync('site/public/content', {recursive:true, force:true});
fs.cpSync('content', 'site/public/content', {recursive:true});
if (process.env.GALLERY_FIXTURE === '1') fs.cpSync('fixtures/works', 'site/public/content/works', {recursive:true});
const manifest = {};
const metadataCache=fs.existsSync('.cache/media-metadata.json')?JSON.parse(fs.readFileSync('.cache/media-metadata.json','utf8')):{};
async function inspect(dir) {
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) await inspect(file);
    // Components reference WebP/posters; AVIF is a responsive picture source only.
    else if (/\.webp$/i.test(file)) {
      const key='/'+path.relative('site/public',file);
      const digest=createHash('sha256').update('alpha255-dominant64-v2').update(fs.readFileSync(file)).digest('hex');
      if(metadataCache[key]?.digest===digest){manifest[key]=metadataCache[key].value;continue}
      const meta = await sharp(file).metadata();
      let coverage=0;
      if(meta.hasAlpha) {
       const alpha=await sharp(file).extractChannel('alpha').raw().toBuffer();
       let transparent=0;for(const value of alpha)if(value<255)transparent++;
       coverage=transparent/alpha.length;
      }
      const {data:thumb,info:thumbInfo}=await sharp(file).resize(64,64,{fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const bins=new Map();
      for(let i=0;i<thumb.length;i+=thumbInfo.channels){if(thumb[i+3]<128)continue;const bin=(thumb[i]>>4)*256+(thumb[i+1]>>4)*16+(thumb[i+2]>>4);const v=bins.get(bin)||{count:0,r:0,g:0,b:0};v.count++;v.r+=thumb[i];v.g+=thumb[i+1];v.b+=thumb[i+2];bins.set(bin,v)}
      const dominant=[...bins.values()].sort((a,b)=>b.count-a.count)[0]||{count:1,r:0,g:0,b:0};
      const [r,g,b]=[dominant.r,dominant.g,dominant.b].map(n=>Math.round(n/dominant.count));
      manifest[key]={width:meta.width,height:meta.pageHeight || meta.height, transparent:coverage>=.02, dominant:`rgb(${r} ${g} ${b})`};
      metadataCache[key]={digest,value:manifest[key]};
    }
  }
}
await inspect('site/public/content');
fs.writeFileSync('.cache/media.json',JSON.stringify(manifest));
fs.writeFileSync('.cache/media-metadata.json',JSON.stringify(metadataCache));
let text='';
function collect(value) {
  if(typeof value==='string')text+=value;
  else if(value && typeof value==='object')Object.values(value).forEach(collect);
}
const {parse}=await import('yaml');
function walkContent(dir) {
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walkContent(p);
    else if(/\.yaml$/.test(p))collect(parse(fs.readFileSync(p,'utf8')));
  }
}
walkContent('site/public/content');
// Only string literals rendered by the app; avoid glyphs introduced by code identifiers.
collect(JSON.parse(fs.readFileSync('site/src/ui.json','utf8')));
fs.writeFileSync('.cache/font-text.json',JSON.stringify(text));
// Publisher uses the verified Python cache; cloud builds use bundled deterministic fonts.
const python=path.join(root,'.venv/bin/python');
if(fs.existsSync(python)) execFileSync(python,['scripts/subset-fonts.py'],{stdio:'inherit'});
else {
 const prebuilt=path.join(root,'scripts/fonts/prebuilt');
 const same=createHash('sha256').update(text).digest('hex')===fs.readFileSync(path.join(prebuilt,'text.sha256'),'utf8').trim();
 for(const name of ['long-cang','caveat'])fs.copyFileSync(path.join(prebuilt,`${name}-${same?'subset':'full'}.woff2`),path.join(root,`site/public/fonts/${name}-subset.woff2`));
 console.log(`Using bundled ${same?'subset':'full'} fonts (no cloud Python dependency).`);
}
console.log(`Prepared ${Object.keys(manifest).length} media records; fixtures ${process.env.GALLERY_FIXTURE==='1'?'enabled':'excluded'}.`);
