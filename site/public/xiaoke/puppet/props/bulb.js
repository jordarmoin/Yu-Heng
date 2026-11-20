import { SKIN, WEB } from '../palette.js';
import { prop, box, disk } from './cel.js';

export const draw = prop((ctx, o) => {
  disk(ctx,WEB.ochre,0,-8,18);
  disk(ctx,SKIN.gloss,-5,-12,7);
  box(ctx,WEB.paper,-9,8,18,12);
});
