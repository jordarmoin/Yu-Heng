import { defineFx } from '../fx.js';
import { TAU, clamp, ease } from '../math.js';
import { WEB, derive } from '../palette.js';

// Polish (Claude): jet exhaust. A short string of ink puffs left behind the body (never painted over it),
// each puff swells, drifts back and thins out. e.dir = travel direction; the trail extends opposite.
const LIT = derive(WEB.ink).light;
defineFx('inkTrail', (ctx, e, τ) => {
  const D = e.duration ?? 0.75, u = clamp(τ / D);
  if (τ >= D) return false;
  const s = e.s ?? 1, dir = e.dir ?? 1;
  ctx.translate(e.x, e.y);
  ctx.scale(s, s);
  ctx.globalAlpha *= 1 - ease.in(u);
  for (let i = 0; i < 4; i++) {
    const back = -dir * (i * 30 + 40 * ease.outCubic(u)), r = (16 - i * 3) * (0.7 + 0.6 * ease.outCubic(u));
    const y = Math.sin(i * 1.7 + u * 6) * 5;
    ctx.fillStyle = LIT; ctx.beginPath(); ctx.arc(back - 2, y - 2, r, 0, TAU); ctx.fill();
    ctx.fillStyle = WEB.ink; ctx.beginPath(); ctx.arc(back + 1, y + 1.5, r, 0, TAU); ctx.fill();
  }
  return true;
});
