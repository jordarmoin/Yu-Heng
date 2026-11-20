import { effect, puff } from './cel.js';
import { WEB } from '../palette.js';

effect('steam', 0.81, (ctx, u, e, t) => {
  ctx.translate(0,-22*u);
  puff(ctx,u,WEB.paper);
});
