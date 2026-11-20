import { WEB } from '../palette.js';
import { prop, polygon, box } from './cel.js';

export const draw = prop((ctx, o) => {
  box(ctx, WEB.ink,-46,-48,92,55);
  ctx.fillStyle = WEB.codex;
  ctx.fillRect(-39,-41,78,40);
  ctx.fillStyle = WEB.sheet;
  ctx.fillRect(-30,-31,36,4);
  ctx.fillRect(-30,-21,21,4);
  polygon(ctx,WEB.paper,[[-46,7],[46,7],[55,19],[-55,19]]);
});
