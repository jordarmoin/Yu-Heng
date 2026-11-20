import { WEB } from '../palette.js';
import { prop, polygon } from './cel.js';

export const draw = prop((ctx, o) => {
  polygon(ctx,WEB.paper,[[-9,32],[9,32],[8,-4],[18,-14],[18,-28],[9,-34],[7,-20],[-7,-20],[-9,-34],[-18,-28],[-18,-14],[-8,-4]]);
});
