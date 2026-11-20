import { effect } from './cel.js';
import { WEB } from '../palette.js';
import { TAU, hash } from '../math.js';

effect('confetti', 1.1, (ctx, u, e, t) => {
  const colors=[WEB.accent,WEB.ochre,WEB.pine,WEB.plum,WEB.codex];
  for(let i=0;i<30;i++){ const a=hash(i*7)*TAU, r=hash(i*3)*155*u;
  ctx.fillStyle=colors[i%colors.length];
  ctx.fillRect(Math.cos(a)*r, Math.sin(a)*r-90*u+125*u*u,7,4);
  }
});
