import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
const port=Number(process.env.QA_PORT||4388);
const base=process.env.QA_BASE||`http://127.0.0.1:${port}`;
const fixtureBase=process.env.QA_FIXTURE_BASE||(fs.existsSync('.cache/fixture-dist/zh/index.html')?`http://127.0.0.1:${port+1}`:undefined);
const shots=process.env.GALLERY_SHOTS||'/var/lib/claude-isolated/workbench/gallery-design/shots/A';
fs.mkdirSync(shots,{recursive:true});
const servers=[];
async function serve(dir,origin) {
 const root=path.resolve(dir);const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.avif':'image/avif','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.gif':'image/gif'};
 const server=http.createServer((req,res)=>{
  let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(!fs.existsSync(p)){res.writeHead(404).end();return}
  const size=fs.statSync(p).size;const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  const headers={'Content-Type':mime[path.extname(p)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'public, max-age=60'};
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(p,{start,end}).pipe(res)}
  else {res.writeHead(200,{...headers,'Content-Length':size});fs.createReadStream(p).pipe(res)}
 });
 await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(Number(new URL(origin).port),'127.0.0.1',resolve)});servers.push(server);
}
if(!process.env.QA_BASE)await serve('dist',base);
if(fixtureBase&&!process.env.QA_FIXTURE_BASE)await serve('.cache/fixture-dist',fixtureBase);
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--proxy-server=http://127.0.0.1:18890','--proxy-bypass-list=localhost;127.0.0.1']});
const a2=process.env.QA_BRIEF==='A2';
const results={errors:[],requestsFailed:[],checks:[],pages:[],metrics:[],screenshots:[],design:[]};
const reportName=process.env.QA_WIDTH?`qa-${process.env.QA_WIDTH}-${process.env.QA_THEME||'all'}.json`:'qa.json';
const save=()=>fs.writeFileSync(path.join(shots,reportName),JSON.stringify(results,null,2)+'\n');
const check=(name,value)=>{assert.ok(value,name);results.checks.push(name)};
try {
 for(const width of (process.env.QA_WIDTH?[Number(process.env.QA_WIDTH)]:[1440,390]))for(const theme of (process.env.QA_THEME?[process.env.QA_THEME]:['day','night'])){
  const page=await browser.newPage();
  await page.setViewport({width,height:width===390?844:900,isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1});
  page.on('pageerror',e=>results.errors.push(String(e)));
  page.on('console',msg=>{if(msg.type()==='error')results.errors.push(msg.text())});
  page.on('response',response=>{if(response.status()>=400)results.requestsFailed.push(`${response.status()} ${response.url()}`)});
  await page.evaluateOnNewDocument(theme=>{localStorage.setItem('gallery-theme',theme);new PerformanceObserver(list=>{window.__cls=(window.__cls||0)+list.getEntries().filter(e=>!e.hadRecentInput).reduce((s,e)=>s+e.value,0)}).observe({type:'layout-shift',buffered:true})},theme);
  async function go(route,origin=base){await page.goto(origin+route,{waitUntil:'networkidle0'});await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await new Promise(r=>setTimeout(r,180));const data=await page.evaluate(()=>({path:location.pathname,width:innerWidth,scroll:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,missing:[...document.images].filter(i=>i.hasAttribute('src')&&i.getAttribute('src')&&!i.complete).map(i=>i.src),undimensioned:[...document.images].filter(i=>!i.hasAttribute('width')||!i.hasAttribute('height')).map(i=>i.outerHTML.slice(0,100))}));check(`no horizontal overflow: ${route} ${width} ${theme}`,data.scroll<=data.width);check(`image dimensions: ${route}`,data.undimensioned.length===0);check(`theme: ${theme}`,data.theme===theme);results.pages.push(data)}
  async function snap(name,fullPage=false){if(a2&&!(['home-zh','home-en'].includes(name)||(theme==='day'&&['film-top','film-spread-1','stickers-full'].includes(name))))return;await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});const file=`${name}-${width}-${theme}.png`;await page.screenshot({path:path.join(shots,file),fullPage});results.screenshots.push(file);save();console.log(file)}
  await go('/zh/');check('real home has exactly two works',await page.$$eval('.album-piece',els=>els.length===2));await snap('home-zh');
  async function checkLetter(){
   const design=await page.evaluate(()=>{
    const seal=getComputedStyle(document.querySelector('.name-seal'));const letter=document.querySelector('.letter>p');const node=letter.firstChild;
    const lines=[];for(let i=0;i<node.length;i++){const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const y=Math.round(range.getBoundingClientRect().top);let line=lines.find(l=>l.y===y);if(!line){line={y,text:''};lines.push(line)}line.text+=node.textContent[i]}
    return {path:location.pathname,width:innerWidth,theme:document.documentElement.dataset.theme,seal:{width:seal.width,height:seal.height,blend:seal.mixBlendMode,opacity:seal.opacity},wrap:getComputedStyle(letter).textWrap,lines:lines.map(l=>l.text)};
   });results.design.push(design);
   check('A2 header seal is 34px',design.seal.width==='34px'&&design.seal.height==='34px');
   check('A2 balanced intro without orphan',design.wrap==='balance'&&design.lines.at(-1).trim().length>2);
   if(theme==='night')check('A2 night seal uses normal blend at 92%',design.seal.blend==='normal'&&design.seal.opacity==='0.92');
  }
  if(a2)await checkLetter();
  results.metrics.push(await page.evaluate(()=>({width:innerWidth,theme:document.documentElement.dataset.theme,cls:window.__cls||0,transfer:performance.getEntriesByType('resource').reduce((s,r)=>s+r.transferSize,0),requests:performance.getEntriesByType('resource').length,fonts:performance.getEntriesByType('resource').filter(r=>r.name.includes('/fonts/')).length})));
  await page.click('.theme-toggle');check('theme toggle changes palette',await page.evaluate(theme=>document.documentElement.dataset.theme!==theme,theme));await page.click('.theme-toggle');
  await page.click('.language-links a[lang=en]');await page.waitForFunction(()=>document.documentElement.lang==='en');await page.waitForNetworkIdle({idleTime:300});await page.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,400));await snap('home-en');if(a2)await checkLetter();
  await go('/zh/list/');await snap('index');check('index has two real works',await page.$$eval('.index-row',els=>els.length===2));
  await go('/zh/works/a-little-spark/');check('file tree initially closed',await page.$eval('.files',el=>!el.open));await snap('film-top');
  if(a2){
   const design=await page.evaluate(()=>{
    const stamp=getComputedStyle(document.querySelector('.year-seal'));const play=getComputedStyle(document.querySelector('.hero-play'));
    const film=document.querySelector('.film-start');
    return {stamp:{width:stamp.width,height:stamp.height,opacity:stamp.opacity,blend:stamp.mixBlendMode},play:{x:parseFloat(play.left)/film.offsetWidth,y:parseFloat(play.top)/film.offsetHeight,right:(parseFloat(play.left)+parseFloat(play.width)/2)/film.offsetWidth},tape:getComputedStyle(document.querySelector('.hero-mount .tape')).color};
   });results.design.push({film:design,width,theme});
   check('A2 52px year stamp and theme opacity',design.stamp.width==='52px'&&design.stamp.height==='52px'&&design.stamp.opacity===(theme==='day'?'0.65':'0.92'));
   if(theme==='night')check('A2 night year stamp normal blend',design.stamp.blend==='normal');
   check('A2 play circle at 40%/58%',Math.abs(design.play.x-.4)<.001&&Math.abs(design.play.y-.58)<.001);
   check('A2 play circle clears the garden character face',design.play.right<.50);
   check('A2 tape retains day alpha',design.tape.endsWith('0.3)'));
   async function arrowMetrics(){return page.$eval('#spread-1',spread=>{
    const svg=spread.querySelector('.layout-arrow');const piece=spread.querySelector('.piece-button');const copy=spread.querySelector('.story-copy');
    const p=piece.getBoundingClientRect(),c=copy.getBoundingClientRect(),s=spread.getBoundingClientRect();
    const bottom=Math.max(...[...document.querySelector('.work-top').children].map(el=>el.getBoundingClientRect().bottom));
    if(getComputedStyle(svg).display==='none')return {hidden:true,gap:p.top-bottom};
    const coords=svg.querySelector('path').getAttribute('d').match(/C ([^M]+)/)[1].trim().split(/\s+/).map(Number);
    const matrix=new DOMMatrix(getComputedStyle(piece.closest('.story-piece')).transform);
    const expected={x:p.left+p.width/2+matrix.a*piece.offsetWidth/2+matrix.c*.22*piece.offsetHeight-s.left,y:p.top+p.height/2+matrix.b*piece.offsetWidth/2+matrix.d*.22*piece.offsetHeight-s.top};
    return {gap:p.top-bottom,centreDelta:Math.abs(c.top+c.height/2-p.top-p.height/2),endError:Math.hypot(coords[4]-expected.x,coords[5]-expected.y),pointsIn:coords[4]<coords[2],path:svg.querySelector('path').getAttribute('d')};
   })}
   let arrow=await arrowMetrics();results.design.push({arrow,width,theme});
   if(width===1440){check('A2 opening gap about 96px',arrow.gap>80&&arrow.gap<110);check('A2 text column centred on print',arrow.centreDelta<1);check('A2 arrow touches print edge and points inward',arrow.endError<1&&arrow.pointsIn);
    await page.setViewport({width:1180,height:900});await new Promise(r=>setTimeout(r,250));const resized=await arrowMetrics();results.design.push({resizedArrow:resized,width:1180,theme});check('A2 arrow recomputes after resize',resized.path!==arrow.path&&resized.endError<1&&resized.centreDelta<1);await page.setViewport({width,height:900});await new Promise(r=>setTimeout(r,250));
   }else check('A2 phone arrow hidden',arrow.hidden);
  }
  for(let i=1;i<=3;i++){await page.$eval(`#spread-${i}`,el=>el.scrollIntoView({block:'center',behavior:'instant'}));await new Promise(r=>setTimeout(r,300));await snap(`film-spread-${i}`)}
  // Force lazy pieces to load before a full-page screenshot.
  await page.evaluate(async()=>{for(const im of document.querySelectorAll('img[loading=lazy]'))im.loading='eager';await Promise.all([...document.images].filter(i=>i.src).map(i=>i.decode().catch(()=>{})))});
  await snap('film-full',true);
  await page.$eval('.files',el=>{el.open=true;el.scrollIntoView({block:'start',behavior:'instant'})});await snap('file-tree');
  const first=await page.$('[data-piece]');await first.click();await page.waitForSelector('.lightbox[open]');await new Promise(r=>setTimeout(r,400));await snap('lightbox');
  const before=await page.$eval('.lightbox-count',el=>el.textContent);await page.keyboard.press('ArrowRight');const after=await page.$eval('.lightbox-count',el=>el.textContent);check('lightbox arrow keys',before!==after);
  for(let i=0;i<5;i++)await page.keyboard.press('Tab');check('dialog traps keyboard focus',await page.evaluate(()=>!!document.activeElement?.closest('.lightbox')));
  if(width===390){await page.evaluate(()=>{const d=document.querySelector('.lightbox');for(const [type,x] of [['touchstart',270],['touchend',90]])d.dispatchEvent(new TouchEvent(type,{changedTouches:[new Touch({identifier:1,target:d,clientX:x,clientY:200})],bubbles:true}))});check('touch swipe steps through pieces',await page.$eval('.lightbox-count',el=>el.textContent)!==after)}
  await page.keyboard.press('Escape');check('lightbox Escape closes',await page.$eval('.lightbox',el=>!el.open));check('lightbox restores focus',await page.evaluate(()=>document.activeElement?.hasAttribute('data-piece')));
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));const initial=await page.$eval('.film-player',el=>el.getBoundingClientRect().height);await page.click('.film-start');await page.waitForFunction(()=>document.querySelector('[data-film]').currentTime>0);check('film plays with native controls',await page.$eval('[data-film]',el=>el.controls&&!el.hidden));const final=await page.$eval('.film-player',el=>el.getBoundingClientRect().height);check('film player keeps layout',Math.abs(initial-final)<1);
  await go('/zh/works/little-ke/');check('24 stickers across two spreads',await page.$$eval('.scatter-grid .story-piece',els=>els.length===24));await page.evaluate(async()=>{for(const im of document.querySelectorAll('img[loading=lazy]'))im.loading='eager';await Promise.all([...document.images].filter(i=>i.src).map(i=>i.decode().catch(()=>{})))});await snap('stickers-full',true);
  if(a2){const scatter=await page.evaluate(()=>({columns:getComputedStyle(document.querySelector('.scatter-grid')).gridTemplateColumns.split(' ').length,pieces:[...document.querySelectorAll('.scatter-piece')].map(el=>{const r=el.getBoundingClientRect(),s=el.style,m=new DOMMatrix(getComputedStyle(el).transform);return {actual:{x:m.e,y:m.f,tilt:Math.atan2(m.b,m.a)*180/Math.PI,scale:Math.hypot(m.a,m.b)},left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY,x:parseFloat(s.getPropertyValue('--scatter-x')||s.getPropertyValue('--jitter-x')),y:parseFloat(s.getPropertyValue('--offset')),tilt:parseFloat(s.getPropertyValue('--tilt')),scale:parseFloat(s.getPropertyValue('--scale'))}})}));results.design.push({scatter,width,theme});check('A2 scatter columns',scatter.columns===(width===1440?4:3));check('A2 scatter seeded jitter and scale ranges',scatter.pieces.every(p=>Math.abs(p.x)<=28&&Math.abs(p.y)<=36&&Math.abs(p.tilt)<=6&&p.scale>=.9&&p.scale<=1.08));check('A2 actual scatter transform matches seed/layout',scatter.pieces.every(p=>Math.abs(p.actual.x-p.x)<.01&&Math.abs(p.actual.y-p.y)<.01&&Math.abs(p.actual.tilt-p.tilt)<.01&&Math.abs(p.actual.scale-p.scale)<.001));check('A2 scatter stays within viewport',scatter.pieces.every(p=>p.left>=0&&p.right<=width));check('A2 neighbour overlap at most 8%',scatter.pieces.every((p,i,all)=>i%scatter.columns===0||all[i-1].right-p.left<=.08*Math.min(p.right-p.left,all[i-1].right-all[i-1].left)+1));}

  await page.$eval('.files',el=>{el.open=true;el.scrollIntoView({block:'start',behavior:'instant'})});await snap('stickers-files');check('24 individual GIF download links',await page.$$eval('a[download]',els=>els.filter(el=>el.href.endsWith('.gif')).length===24));
  if(width===1440){await go('/zh/works/little-ke/');await page.hover('.scatter-grid [data-piece]');await page.waitForSelector('.scatter-grid .is-playing');check('sticker plays on hover',true)}
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await go('/zh/');check('reduced motion disables autoplay',await page.$eval('[data-auto-motion]',el=>el.paused&&!el.dataset.loaded));await page.click('[data-reduced-play]');await page.waitForFunction(()=>!document.querySelector('[data-auto-motion]').paused);check('reduced motion allows deliberate play',true);
  await go('/zh/works/little-ke/');const sticker=await page.$('.scatter-grid [data-piece]');await sticker.click();await page.waitForSelector('.lightbox[open]');check('reduced motion lightbox starts on poster',await page.$eval('.lightbox-image',el=>!el.src.includes('-animated-')));check('reduced motion explicit animation control',await page.$eval('.lightbox-play',el=>!el.hidden));await page.click('.lightbox-play');check('explicit sticker playback',await page.$eval('.lightbox-image',el=>el.src.includes('-animated-')));await page.keyboard.press('Escape');await page.emulateMediaFeatures([]);
  await go('/en/works/a-little-spark/');await snap('film-en-top');await page.click('.language-links a[lang=zh]');await page.waitForFunction(()=>location.pathname==='/zh/works/a-little-spark/');check('language switch preserves work path',true);
  if(fixtureBase){await go('/zh/',fixtureBase);check('fixture stack enabled only in fixture build',await page.$('.is-stack'));await page.$eval('.is-stack',el=>el.scrollIntoView({block:'center',behavior:'instant'}));await snap('nested-stack');await go('/zh/works/test-collection/',fixtureBase);await snap('nested-collection');await go('/zh/works/test-collection/inner/',fixtureBase);await snap('nested-inner');await go('/zh/works/test-collection/inner/keepsake/',fixtureBase);await snap('nested-deep');check('two-level nesting breadcrumbs',await page.$$eval('.breadcrumb li',els=>els.length===4));check('draft is hidden',!(await page.content()).includes('Draft must stay hidden'))}
  await page.close();
 }
 check('zero page/console errors',results.errors.length===0);check('zero HTTP errors',results.requestsFailed.length===0);check('home CLS <0.1',results.metrics.every(m=>m.cls<.1));check('cold home transfer <2 MB',results.metrics.every(m=>m.transfer<2_000_000));
} finally {
 save();await browser.close();for(const server of servers){server.closeAllConnections();server.close()}
}
console.log(JSON.stringify({checks:results.checks.length,screenshots:results.screenshots.length,errors:results.errors,metrics:results.metrics},null,2));
