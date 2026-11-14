let cleanup = () => {};
function setup() {
 cleanup();
 const controller=new AbortController();const signal=controller.signal;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const on=(el:EventTarget,type:string,fn:EventListenerOrEventListenerObject)=>el.addEventListener(type,fn,{signal});
 const theme=document.querySelector<HTMLButtonElement>('.theme-toggle');
 if(theme) {
  const update=()=>theme.setAttribute('aria-pressed',String(document.documentElement.dataset.theme==='night'));
  update();on(theme,'click',()=>{const next=document.documentElement.dataset.theme==='night'?'day':'night';document.documentElement.dataset.theme=next;try{localStorage.setItem('gallery-theme',next)}catch{}update()});
 }
 try {if(sessionStorage.getItem('gallery-settled'))document.body.classList.add('has-settled');else sessionStorage.setItem('gallery-settled','1')}catch{}
 const loops=[...document.querySelectorAll<HTMLVideoElement>('video[data-auto-motion]')];
 const hydrate=(v:HTMLVideoElement)=>{if(!v.dataset.loaded){v.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach(s=>{s.src=s.dataset.src!});v.load();v.dataset.loaded='true'}};
 const play=(v:HTMLVideoElement)=>{hydrate(v);void v.play().then(()=>v.classList.add('is-playing')).catch(()=>{})};
 const pause=(v:HTMLVideoElement)=>{v.pause();v.classList.remove('is-playing')};
 const visible=new Set<HTMLVideoElement>();
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const v=entry.target as HTMLVideoElement;if(entry.intersectionRatio>=.6){visible.add(v);if(!reduced.matches)play(v)}else{visible.delete(v);pause(v)}}),{threshold:[0,.6]});
 loops.forEach(v=>{
  observer.observe(v);const parent=v.closest('.piece-body')!;
  on(parent,'mouseenter',()=>{if(!reduced.matches)play(v)});
  on(parent,'mouseleave',()=>{if(!visible.has(v))pause(v)});
  on(parent,'focusin',()=>{if(!reduced.matches)play(v)});
  on(parent.querySelector('[data-reduced-play]')!,'click',event=>{event.preventDefault();v.paused?play(v):pause(v)});
 });
 document.querySelectorAll<HTMLButtonElement>('.film-start').forEach(start=>on(start,'click',()=>{
  const v=start.parentElement!.querySelector<HTMLVideoElement>('video')!;hydrate(v);v.hidden=false;start.hidden=true;v.focus();void v.play().catch(()=>{});
 }));
 const pieces=[...document.querySelectorAll<HTMLButtonElement>('[data-piece]')];
 const animate=(button:HTMLButtonElement)=>{
  if(reduced.matches)return;
  const anim=button.querySelector<HTMLImageElement>('[data-motion-src]');if(!anim)return;
  if(!anim.src)anim.src=(innerWidth<720?anim.dataset.motionSmall:anim.dataset.motionSrc)!;
  if(anim.complete&&anim.naturalWidth)button.classList.add('is-playing');
  else anim.onload=()=>button.classList.add('is-playing');
 };
 pieces.forEach(button=>{
  on(button,'mouseenter',()=>animate(button));on(button,'focus',()=>animate(button));
  const stop=()=>{button.classList.remove('is-playing');const anim=button.querySelector<HTMLImageElement>('[data-motion-src]');if(anim)anim.onload=null};
  on(button,'mouseleave',stop);on(button,'blur',stop);
 });
 // Idle life: random on-screen stickers wake up for a few seconds, a few at a time.
 const sleepers=pieces.filter(b=>b.dataset.animated==='true'&&b.closest('.scatter-piece'));
 if(sleepers.length){
  const seen=new Set<HTMLButtonElement>();const awake=new Set<HTMLButtonElement>();
  const io=new IntersectionObserver(es=>es.forEach(e=>{const b=e.target as HTMLButtonElement;e.isIntersecting?seen.add(b):seen.delete(b)}),{threshold:.5});
  sleepers.forEach(b=>io.observe(b));
  const tick=()=>{
   setTimeout(tick,1200+Math.random()*1800);
   if(reduced.matches||document.hidden||awake.size>=3)return;
   const pool=[...seen].filter(b=>!awake.has(b)&&!b.matches(':hover,:focus'));if(!pool.length)return;
   const b=pool[Math.floor(Math.random()*pool.length)];awake.add(b);animate(b);
   setTimeout(()=>{awake.delete(b);if(!b.matches(':hover,:focus'))b.classList.remove('is-playing')},2600+Math.random()*2600);
  };
  setTimeout(tick,600);
 }
 const dialog=document.querySelector<HTMLDialogElement>('.lightbox')!;
 const image=dialog.querySelector<HTMLImageElement>('.lightbox-image')!;
 const caption=dialog.querySelector<HTMLElement>('figcaption')!;
 const counter=dialog.querySelector<HTMLElement>('.lightbox-count')!;
 const prev=dialog.querySelector<HTMLButtonElement>('.lightbox-prev')!;
 const next=dialog.querySelector<HTMLButtonElement>('.lightbox-next')!;
 const playButton=dialog.querySelector<HTMLButtonElement>('.lightbox-play')!;
 let selected=0;let returnFocus:HTMLElement|null=null;
 const show=(index:number)=>{
  selected=(index+pieces.length)%pieces.length;const piece=pieces[selected];
  const animated=piece.dataset.animated==='true';
  image.src=animated&&reduced.matches?piece.dataset.poster!:piece.dataset.src!;
  const original=piece.querySelector('img');const width=Number(original?.getAttribute('width'))||1600;const height=Number(original?.getAttribute('height'))||900;
  image.width=1600;image.height=Math.round(1600*height/width);
  image.alt=piece.dataset.alt||piece.dataset.caption||'';caption.textContent=piece.dataset.caption||'';
  counter.textContent=`${selected+1} / ${pieces.length}`;
  prev.disabled=pieces.length<2;next.disabled=pieces.length<2;
  playButton.hidden=!(animated&&reduced.matches);
 };
 pieces.forEach((piece,index)=>on(piece,'click',()=>{
  returnFocus=piece;
  const open=()=>{show(index);dialog.showModal();dialog.querySelector<HTMLButtonElement>('.lightbox-close')!.focus()};
  if(document.startViewTransition&&!reduced.matches){
   const name=piece.style.viewTransitionName||'gallery-lightbox-piece';
   piece.style.viewTransitionName=name;
   const transition=document.startViewTransition(()=>{piece.style.viewTransitionName='none';image.style.viewTransitionName=name;open()});
   void transition.ready.catch(()=>{});
   void transition.finished.catch(()=>{}).finally(()=>{piece.style.viewTransitionName=name;image.style.viewTransitionName='none'});
  }else open();
 }));
 const close=()=>dialog.close();
 on(dialog.querySelector('.lightbox-close')!,'click',close);
 on(dialog,'click',e=>{if(e.target===dialog)close()});
 on(dialog,'close',()=>{image.removeAttribute('src');returnFocus?.focus()});
 on(prev,'click',()=>show(selected-1));on(next,'click',()=>show(selected+1));
 on(playButton,'click',()=>{image.src=pieces[selected].dataset.src!;playButton.hidden=true});
 on(dialog,'keydown',((e:KeyboardEvent)=>{if(e.key==='ArrowLeft'){e.preventDefault();show(selected-1)}if(e.key==='ArrowRight'){e.preventDefault();show(selected+1)}}) as EventListener);
 let touchX=0;let touchY=0;
 on(dialog,'touchstart',((e:TouchEvent)=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY}) as EventListener);
 on(dialog,'touchend',((e:TouchEvent)=>{const dx=e.changedTouches[0].clientX-touchX;const dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))show(selected+(dx<0?1:-1))}) as EventListener);
 on(reduced,'change',()=>{if(reduced.matches){loops.forEach(pause);pieces.forEach(p=>p.classList.remove('is-playing'))}else visible.forEach(play)});
 // Keep the seeded scatter loose while limiting neighbouring bounds to 8% overlap.
 const layoutScatter=()=>document.querySelectorAll<HTMLElement>('.scatter-grid').forEach(grid=>{
  const columns=getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  const pieces=[...grid.querySelectorAll<HTMLElement>('.scatter-piece')];
  for(let first=0;first<pieces.length;first+=columns){
   const row=pieces.slice(first,first+columns).map(el=>{
    const rect=el.getBoundingClientRect();const shift=new DOMMatrix(getComputedStyle(el).transform).e;
    const base=rect.left-shift;const desired=Number.parseFloat(el.style.getPropertyValue('--jitter-x'));
    return {el,base,width:rect.width,desired,low:Math.max(base-28,10),high:Math.min(base+28,innerWidth-10-rect.width)};
   });
   const step=(i:number)=>row[i].width-.08*Math.min(row[i].width,row[i+1].width);
   for(let i=1;i<row.length;i++)row[i].low=Math.max(row[i].low,row[i-1].low+step(i-1));
   for(let i=row.length-2;i>=0;i--)row[i].high=Math.min(row[i].high,row[i+1].high-step(i));
   let previous=0;
   row.forEach((entry,i)=>{
    const low=i?Math.max(entry.low,previous+step(i-1)):entry.low;
    const left=Math.max(low,Math.min(entry.high,entry.base+entry.desired));previous=left;
    entry.el.style.setProperty('--scatter-x',`${left-entry.base}px`);
   });
  }
 });
 const scatterObserver=new ResizeObserver(layoutScatter);
 document.querySelectorAll('.scatter-grid,.scatter-piece').forEach(el=>scatterObserver.observe(el));
 void document.fonts.ready.then(layoutScatter);on(window,'resize',layoutScatter);
 // Join the rotated paper scrap to the rotated print edge in current layout coordinates.
 const arrowObserver=new ResizeObserver(()=>drawArrows());
 const drawArrows=()=>document.querySelectorAll<HTMLElement>('.hero-note').forEach(spread=>{
  const svg=spread.querySelector<SVGSVGElement>('.layout-arrow');
  const scrap=spread.querySelector<HTMLElement>('.scrap');
  const piece=spread.querySelector<HTMLElement>('.piece-button');
  if(!svg||!scrap||!piece||getComputedStyle(svg).display==='none')return;
  const bounds=spread.getBoundingClientRect();
  const edge=(el:HTMLElement,rotation:HTMLElement,side:number,fraction:number)=>{
   const rect=el.getBoundingClientRect();const matrix=new DOMMatrix(getComputedStyle(rotation).transform);
   const x=side*el.offsetWidth/2;const y=(fraction-.5)*el.offsetHeight;
   return {x:rect.left+rect.width/2+matrix.a*x+matrix.c*y-bounds.left,
           y:rect.top+rect.height/2+matrix.b*x+matrix.d*y-bounds.top};
  };
  const start=edge(scrap,scrap,-1,.72);
  const end=edge(piece,piece.closest<HTMLElement>('.story-piece')!,1,.72);
  const gap=start.x-end.x;const control={x:end.x+gap*.45,y:end.y+24};
  const angle=Math.atan2(end.y-control.y,end.x-control.x);
  const head=(turn:number)=>`${end.x-11*Math.cos(angle+turn)} ${end.y-11*Math.sin(angle+turn)}`;
  svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  svg.querySelector('path')!.setAttribute('d',`M ${start.x} ${start.y} C ${start.x-gap*.3} ${start.y+30} ${control.x} ${control.y} ${end.x} ${end.y} M ${head(.48)} L ${end.x} ${end.y} L ${head(-.48)}`);
 });
 document.querySelectorAll('.hero-note,.hero-note .scrap,.hero-note .story-piece').forEach(el=>arrowObserver.observe(el));
 void document.fonts.ready.then(drawArrows);on(window,'resize',drawArrows);
 const preview=document.querySelector<HTMLImageElement>('.cursor-preview');
 if(preview&&matchMedia('(hover:hover) and (min-width:720px)').matches){
  document.querySelectorAll<HTMLAnchorElement>('[data-thumb]').forEach(row=>{
   on(row,'mouseenter',()=>{preview.src=row.dataset.thumb!;preview.hidden=false});
   on(row,'mousemove',((e:MouseEvent)=>{preview.style.left=Math.min(e.clientX+24,innerWidth-210)+'px';preview.style.top=Math.min(e.clientY+12,innerHeight-150)+'px'}) as EventListener);
   on(row,'mouseleave',()=>{preview.hidden=true});
  });
 }
 on(document,'visibilitychange',()=>{if(document.hidden)loops.forEach(pause);else if(!reduced.matches)visible.forEach(play)});
 cleanup=()=>{controller.abort();observer.disconnect();arrowObserver.disconnect();scatterObserver.disconnect();loops.forEach(v=>v.pause());if(dialog.open)dialog.close()};
}
document.addEventListener('astro:page-load',setup);
document.addEventListener('astro:before-swap',()=>cleanup());
