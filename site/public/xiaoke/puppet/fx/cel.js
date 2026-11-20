import { defineFx } from '../fx.js';
import { clamp, TAU } from '../math.js';
import { SKIN, WEB } from '../palette.js';

export function effect(name, duration, paint) {
  defineFx(name, (ctx, e, t) => {
    const u = clamp(t / (e.duration ?? duration));
    if (u >= 1) return false;
    const scale = e.s ?? 1;
    ctx.translate(e.x, e.y);
    ctx.scale(scale, scale);
    ctx.globalAlpha *= Math.min(1, t * 24) * (1 - u * u);
    ctx.fillStyle = ctx.strokeStyle = e.color ?? WEB.accent;
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    paint(ctx, u, { ...e, s: scale, dir: e.dir ?? 1 }, t);
    return true;
  });
}

export function dot(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

export function stroke(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

export function puff(ctx, u, color = SKIN.under) {
  ctx.fillStyle = color;
  ctx.strokeStyle = SKIN.line;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const a = i * TAU / 7, r = (12 + i % 3 * 2) * (0.65 + u);
    const x = Math.cos(a) * (8 + u * 14), y = Math.sin(a) * (8 + u * 13);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.stroke();
  ctx.fill();
}

export function glyph(ctx, text, x, y) {
  ctx.font = '700 32px "Resource Han Rounded SC"';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}
