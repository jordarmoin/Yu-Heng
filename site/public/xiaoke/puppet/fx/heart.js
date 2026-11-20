import { effect } from './cel.js';

effect('heart', 0.9, (ctx, u, e, t) => {
  ctx.translate(0,-30*u);
  ctx.beginPath();
  ctx.moveTo(0,13);
  ctx.bezierCurveTo(-37,-10,-9,-29,0,-14);
  ctx.bezierCurveTo(9,-29,37,-10,0,13);
  ctx.fill();
});
