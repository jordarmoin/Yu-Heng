import { WEB } from '../palette.js';
import { prop, box, label } from './cel.js';

export const draw = prop((ctx, o) => {
  box(ctx,WEB.ochre,-4,18,8,34);
  box(ctx,WEB.sheet,-58,-36,116,62);
  label(ctx,o.title ?? '我在这儿',0,-8,100,19);
  label(ctx,o.sub ?? '小克',0,13,100,13);
});
