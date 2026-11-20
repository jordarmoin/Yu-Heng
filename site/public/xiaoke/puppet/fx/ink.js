import { defineFx } from '../fx.js';
import { TAU, clamp, ease, hash } from '../math.js';
import { WEB, derive } from '../palette.js';

// Polish (Claude): the ink cloud. A lumpy cel silhouette (no outline, no rosette), lit from the top-left
// by a lighter ink rim and two sheet gloss ticks. Burst 0–0.16 · hold and boil · disperse into droplets.
// Big enough (≈ 125 rig units) to hide Xiao Ke completely at the same `s`, so verbs can cut behind it.
const INK = WEB.ink, LIT = derive(WEB.ink).light;
const LUMPS = Array.from({ length: 9 }, (_, i) => ({
  a: i * TAU / 9 + (hash(i * 7 + 1) - 0.5) * 0.5, d: 52 + 18 * hash(i * 7 + 2), r: 44 + 20 * hash(i * 7 + 3),
  drift: 0.6 + 0.8 * hash(i * 7 + 4),
}));
const DROPS = Array.from({ length: 8 }, (_, i) => ({
  a: -Math.PI / 2 + (i / 7 - 0.5) * 3.6 + (hash(i * 5 + 9) - 0.5) * 0.3, v: 210 + 140 * hash(i * 5 + 10), r: 6 + 6 * hash(i * 5 + 11),
}));

function blobs(ctx, u, grow, spread, dx, dy, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const core = 70 * grow * (1 - spread);
  if (core > 0.5) { ctx.moveTo(dx + core, dy); ctx.arc(dx, dy, core, 0, TAU); }
  for (const [i, L] of LUMPS.entries()) {
    const boil = 1 + 0.06 * Math.sin(u * 19 + i * 2.1);
    const d = L.d * grow + spread * 130 * L.drift, r = L.r * grow * boil * (1 - 0.92 * spread);
    if (r < 0.5) continue;
    const x = dx + Math.cos(L.a) * d, y = dy + Math.sin(L.a) * d * 0.82 - spread * 36 * L.drift;
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
  }
  ctx.fill();
}

defineFx('ink', (ctx, e, τ) => {
  const D = e.duration ?? 0.95, u = clamp(τ / D);
  if (τ >= D) return false;
  const s = e.s ?? 1;
  ctx.translate(e.x, e.y);
  ctx.scale(s, s);
  const grow = ease.outBack(clamp(τ / 0.16), 1.4);
  const spread = ease.inOut(clamp((u - 0.45) / 0.5));
  const fade = 1 - ease.in(clamp((u - 0.6) / 0.4));
  ctx.globalAlpha *= fade;
  blobs(ctx, u, grow, spread, -5, -5, LIT);            // lit rim on the top-left
  blobs(ctx, u, grow, spread, 2, 3, INK);
  if (spread < 0.6) {                                  // gloss ticks, like the body's
    ctx.globalAlpha *= 1 - spread / 0.6;
    ctx.fillStyle = WEB.sheet;
    ctx.beginPath(); ctx.ellipse(-48 * grow, -50 * grow, 13 * grow, 6 * grow, -0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-24 * grow, -60 * grow, 4.5 * grow, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1 - ease.in(clamp((u - 0.7) / 0.3));
  ctx.fillStyle = INK;
  const fly = clamp((τ - 0.08) / 0.7);                 // droplets flung out on arcs
  if (fly > 0) for (const P of DROPS) {
    const x = Math.cos(P.a) * (60 + P.v * fly), y = Math.sin(P.a) * (50 + P.v * fly * 0.8) + 260 * fly * fly;
    const r = P.r * (1 - 0.5 * fly);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  return true;
});
