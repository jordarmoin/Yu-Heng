import { effect, stroke } from './cel.js';

effect('speedLines', 0.38, (ctx, u, e, t) => {
  for(let i=0;i<4;i++) stroke(ctx,[[(-30-28*u)*e.dir,i*12],[(10-40*u-i*4)*e.dir,i*12]]);
});
