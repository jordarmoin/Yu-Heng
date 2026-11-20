import { WEB } from '../palette.js';
import { prop, polygon, box, disk, label } from './cel.js';

export const draw = prop((ctx, o) => {
  const names={front:'前台 Front',brain:'大脑 Brain',box:'工作站 Box'};
  const colors={front:WEB.codex,brain:WEB.pine,box:WEB.plum};
  const variant=o.variant ?? 'front';
  polygon(ctx, WEB.paper,[[-43,-24],[-28,-37],[54,-37],[41,-24]]);
  polygon(ctx,colors[variant],[[41,-24],[54,-37],[54,21],[41,34]]);
  box(ctx,WEB.sheet,-43,-24,84,58);
  label(ctx,names[variant],-1,7,76,13);
  disk(ctx,colors[variant],29,-14,3);
  ctx.fillStyle=WEB.ink;
  ctx.fillRect(-28,14,48,3);
});
