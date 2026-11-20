import { WEB } from '../palette.js';
import { derive } from '../palette.js';
import { prop, polygon } from './cel.js';

// Polish (Claude): a teacher's pointer in the cel language: tapered ochre stick with a lit top band,
// an ink grip and a cinnabar rubber tip. Solid enough to read at 96 px (the old 4-px sliver was mostly edge).
const STICK = derive(WEB.ochre);
export const draw = prop((ctx, o) => {
  polygon(ctx, WEB.ochre, [[-4, -6], [80, -3.2], [80, 3.2], [-4, 6]]);
  ctx.fillStyle = STICK.light;                                     // lit band (light comes from the top-left)
  ctx.beginPath(); ctx.moveTo(2, -4.2); ctx.lineTo(76, -2.2); ctx.lineTo(76, -0.6); ctx.lineTo(2, -1.2); ctx.closePath(); ctx.fill();
  polygon(ctx, WEB.ink, [[-12, -6.5], [6, -6.2], [6, 6.2], [-12, 6.5]]);         // grip
  polygon(ctx, WEB.cinnabar, [[78, -4.2], [90, -3.6], [92, 0], [90, 3.6], [78, 4.2]]); // rubber tip
});
