import { effect, puff } from './cel.js';
import { SKIN } from '../palette.js';

effect('smear', 0.25, (ctx, u, e, t) => {
  ctx.scale(1+2*u,0.42);
  puff(ctx,u,SKIN.light);
});
