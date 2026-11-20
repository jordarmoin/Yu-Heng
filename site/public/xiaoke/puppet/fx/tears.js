import { effect, dot } from './cel.js';
import { WEB } from '../palette.js';

effect('tears', 0.87, (ctx, u, e, t) => {
  for(const side of [-1,1]) for(let i=0;i<3;i++) dot(ctx,side*((12+i*9)*u+20),8+i*9+68*u*u,3+i,WEB.codex);
});
