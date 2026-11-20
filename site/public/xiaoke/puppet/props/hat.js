import { SKIN, WEB } from '../palette.js';
import { prop, box } from './cel.js';

export const draw = prop((ctx, o) => {
  ctx.beginPath();
  ctx.ellipse(0,7,46,39,0,Math.PI,0);
  ctx.closePath();
  ctx.fillStyle=WEB.ochre;
  ctx.fill();
  ctx.stroke();
  box(ctx,SKIN.light,-52,5,104,11);
  ctx.fillStyle=SKIN.gloss;
  ctx.fillRect(-9,-25,18,24);
});
