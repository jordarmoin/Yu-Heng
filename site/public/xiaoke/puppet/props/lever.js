import { WEB } from '../palette.js';
import { prop, box, disk } from './cel.js';

export const draw = prop((ctx, o) => {
  box(ctx,WEB.codex,-30,18,60,13);
  ctx.save();
  ctx.translate(0,19);
  ctx.rotate(o.pull ?? -0.45);
  box(ctx,WEB.ochre,-4,-40,8,40);
  disk(ctx,WEB.cinnabar,0,-42,8);
  ctx.restore();
});
