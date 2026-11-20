import { SKIN, WEB } from '../palette.js';
import { prop, polygon, box } from './cel.js';

export const draw = prop((ctx, o) => {
  polygon(ctx,WEB.paper,[[-39,-24],[-25,-35],[50,-35],[39,-24]]);
  polygon(ctx,WEB.ochre,[[39,-24],[50,-35],[50,18],[39,30]]);
  box(ctx,SKIN.under,-39,-24,78,54);
  ctx.fillStyle=WEB.ochre;
  ctx.fillRect(-7,-23,14,24);
});
