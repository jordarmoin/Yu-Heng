import { WEB } from '../palette.js';
import { prop, polygon } from './cel.js';

export const draw = prop((ctx, o) => {
  polygon(ctx, WEB.paper,[[-52,-19],[52,-19],[62,19],[-62,19]]);
  for(let row=0;row<3;row++) for(let col=0;col<10;col++) { ctx.fillStyle=WEB.codex;
  ctx.fillRect(-43+col*9.6,-12+row*9,7,5);
  }
});
