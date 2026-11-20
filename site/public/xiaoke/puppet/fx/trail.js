import { effect, stroke } from './cel.js';
import { clamp } from '../math.js';

effect('trail', 1.8, (ctx, u, e, t) => {
  ctx.scale(1/e.s,1/e.s);
  const points=e.points ?? [];
  stroke(ctx,points.slice(0,Math.ceil(points.length*clamp(t/(e.reveal ?? 0.6)))));
});
