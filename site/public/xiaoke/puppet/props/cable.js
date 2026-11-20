import { WEB } from '../palette.js';
import { prop, box } from './cel.js';

export const draw = prop((ctx, o) => {
  ctx.beginPath();
  ctx.moveTo(-60,17);
  ctx.bezierCurveTo(-38,-39,-20,36,22,0);
  ctx.lineWidth=5;
  ctx.stroke();
  ctx.lineWidth=2.5;
  box(ctx,WEB.codex,19,-11,25,22);
  box(ctx,WEB.ochre,44,-7,10,4);
  box(ctx,WEB.ochre,44,3,10,4);
});
