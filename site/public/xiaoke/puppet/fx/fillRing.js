import { effect, stroke } from './cel.js';
import { TAU } from '../math.js';

effect('fillRing', 1.5, (ctx, u, e, t) => {
  ctx.globalAlpha=Math.min(1,t*14);
  ctx.beginPath();
  ctx.arc(0,0,22,-TAU/4,TAU*u-TAU/4);
  ctx.stroke();
});
