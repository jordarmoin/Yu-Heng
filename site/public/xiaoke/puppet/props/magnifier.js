import { SKIN, WEB } from '../palette.js';
import { prop, box, disk } from './cel.js';

export const draw = prop((ctx, o) => {
  box(ctx, WEB.ochre, -7, 5, 14, 29);
  disk(ctx, WEB.codex, 0,-14,26);
  disk(ctx, WEB.sheet,0,-14,20);
  ctx.fillStyle = SKIN.gloss;
  ctx.fillRect(-9,-26,13,3);
});
