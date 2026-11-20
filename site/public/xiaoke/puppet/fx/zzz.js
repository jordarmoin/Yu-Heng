import { effect, glyph } from './cel.js';

effect('zzz', 1.6, (ctx, u, e, t) => {
  for(let i=0;i<3;i++) glyph(ctx,'z',i*18,(i+1)*-14-24*u+5*Math.sin(t*4+i));
});
