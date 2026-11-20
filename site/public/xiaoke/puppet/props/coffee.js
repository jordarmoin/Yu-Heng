import { SKIN, WEB } from '../palette.js';
import { prop, polygon, disk } from './cel.js';

export const draw = prop((ctx, o) => {
  disk(ctx,WEB.paper,27,1,15);
  disk(ctx,WEB.ochre,27,1,7);
  polygon(ctx,WEB.sheet,[[-27,-24],[27,-24],[19,29],[-19,29]]);
  ctx.beginPath();
  ctx.ellipse(0,-24,27,7,0,0,2*Math.PI);
  ctx.fillStyle=SKIN.line;
  ctx.fill();
});
