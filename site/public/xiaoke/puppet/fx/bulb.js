import { effect } from './cel.js';
import { PROPS } from '../props/index.js';

effect('bulb', 0.95, (ctx, u, e, t) => {
  PROPS.bulb(ctx,0,-23-9*u,0,0.76);
});
