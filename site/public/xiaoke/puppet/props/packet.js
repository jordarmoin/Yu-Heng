import { WEB } from '../palette.js';
import { prop, polygon, disk } from './cel.js';

export const draw = prop((ctx, o) => {
  disk(ctx,WEB.paper,0,0,34);
  polygon(ctx,WEB.codex,[[-18,-9],[0,-20],[18,-9],[18,12],[0,23],[-18,12]]);
  polygon(ctx,WEB.sheet,[[-18,-9],[0,-20],[18,-9],[0,2]]);
});
