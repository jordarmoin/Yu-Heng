import { effect, glyph } from './cel.js';
import { TAU } from '../math.js';

effect('dizzy', 0.9, (ctx, u, e, t) => {
  for(let i=0;i<4;i++){ const a=t*8+i*TAU/4;
  glyph(ctx,"✦",Math.cos(a)*55,Math.sin(a)*13-10);
  }
});
