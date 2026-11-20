import { effect, stroke } from './cel.js';
import { WEB } from '../palette.js';

effect('anger', 0.65, (ctx, u, e, t) => {
  ctx.strokeStyle=WEB.cinnabar;
  for(let i=0;i<4;i++){ ctx.rotate(Math.PI/2);
  stroke(ctx,[[3,-13],[3,-3],[13,-3]]);
  }
});
