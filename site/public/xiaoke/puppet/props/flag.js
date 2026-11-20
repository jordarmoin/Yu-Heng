import { WEB } from '../palette.js';
import { prop, polygon, box } from './cel.js';

export const draw = prop((ctx, o) => {
  box(ctx,WEB.ochre,-20,-41,5,83);
  polygon(ctx,WEB.cinnabar,[[-15,-39],[41,-39],[30,-23],[41,-8],[-15,-8]]);
});
