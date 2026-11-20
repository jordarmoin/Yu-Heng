import { SKIN, WEB } from '../palette.js';

export function prop(paint) {
  return (ctx, x, y, ang = 0, s = 1, opts = {}) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s);
    ctx.strokeStyle = opts.line ?? SKIN.line;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = ctx.lineCap = 'round';
    paint(ctx, opts);
    ctx.restore();
  };
}

export function polygon(ctx, color, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

export function box(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

export function disk(ctx, color, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

export function label(ctx, text, x, y, w, size = 14) {
  ctx.fillStyle = WEB.ink;
  ctx.font = `500 ${size}px "Resource Han Rounded SC"`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y, w);
}
