// Xiao Ke · small effects in the same cel language (warm line, flat fills). τ = seconds since start.
import { SKIN, WEB } from './palette.js';
import { TAU, clamp, ease, hash } from './math.js';

const LINE = SKIN.line;

function star(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = rot + (i / 8) * TAU, k = i % 2 ? 0.34 : 1;
    const px = x + Math.cos(a) * r * k, py = y + Math.sin(a) * r * k;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export const FX = {
  ripple(ctx, e, τ) { // a tap lands
    const s = e.s ?? 1, col = e.color ?? WEB.accent;
    for (const [d, k] of [[0, 1], [0.1, 0.7]]) {
      const u = clamp((τ - d) / 0.55);
      if (u <= 0 || u >= 1) continue;
      ctx.globalAlpha = (1 - ease.in(u)) * 0.9;
      ctx.strokeStyle = col; ctx.lineWidth = (5 - 3 * u) * s;
      ctx.beginPath(); ctx.arc(e.x, e.y, (8 + 44 * ease.outCubic(u) * k) * s, 0, TAU); ctx.stroke();
    }
    const f = clamp(1 - τ / 0.16);
    if (f > 0) { ctx.globalAlpha = f; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(e.x, e.y, 7 * s * (1 + τ * 3), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    return τ < 0.7;
  },
  sparkle(ctx, e, τ) { // pride / joy glints around the head
    const s = e.s ?? 1;
    const pts = [[-118, -40, 15, 0], [112, -64, 19, 0.12], [86, 8, 10, 0.24]];
    for (const [dx, dy, r, d] of pts) {
      const u = clamp((τ - d) / 0.85);
      if (u <= 0 || u >= 1) continue;
      const k = u < 0.3 ? ease.outBack(u / 0.3, 2.5) : 1 - ease.in((u - 0.3) / 0.7);
      ctx.save();
      ctx.lineJoin = 'round';
      star(ctx, e.x + dx * s, e.y + dy * s, r * s * k, u * 0.8);
      ctx.lineWidth = 2.6 * s; ctx.strokeStyle = LINE; ctx.stroke();
      ctx.fillStyle = '#F7C65A'; ctx.fill();
      ctx.restore();
    }
    return τ < 1.2;
  },
  sweat(ctx, e, τ) { // a nervous drop slides down the temple
    const s = e.s ?? 1, u = clamp(τ / 1.3);
    if (u >= 1) return false;
    const x = e.x + 96 * s, y = e.y + (10 + 40 * ease.in(u)) * s;
    const a = u < 0.15 ? u / 0.15 : 1 - clamp((u - 0.8) / 0.2);
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.moveTo(x, y - 15 * s);
    ctx.bezierCurveTo(x + 9 * s, y - 2 * s, x + 9 * s, y + 9 * s, x, y + 9 * s);
    ctx.bezierCurveTo(x - 9 * s, y + 9 * s, x - 9 * s, y - 2 * s, x, y - 15 * s);
    ctx.closePath();
    ctx.lineWidth = 2.6 * s; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = '#A9D8F2'; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - 3 * s, y + 1 * s, 2.4 * s, 0, TAU); ctx.fill();
    ctx.restore();
    return true;
  },
  dust(ctx, e, τ) { // landing puffs at the feet
    const s = e.s ?? 1, u = clamp(τ / 0.55);
    if (u >= 1) return false;
    ctx.save();
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
      const k = ease.outCubic(u), r = (9 + 7 * i) * s * (1 - 0.6 * u);
      const x = e.x + side * (95 + 40 * k + i * 22) * s, y = e.y - (4 + 10 * k * (1 + i)) * s;
      ctx.globalAlpha = 1 - u;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      ctx.lineWidth = 2.2 * s; ctx.strokeStyle = LINE; ctx.stroke();
      ctx.fillStyle = '#F3ECDF'; ctx.fill();
    }
    ctx.restore();
    return true;
  },
};

export function drawFx(ctx, e, τ) { ctx.save(); const r = FX[e.kind]?.(ctx, e, τ); ctx.restore(); return r; }
export { hash };

/** Extension point: register an effect drawer (ctx, e, τ) from a new file (puppet/fx/<name>.js). */
export function defineFx(name, fn) { if (FX[name]) throw new Error('fx exists: ' + name); FX[name] = fn; }
