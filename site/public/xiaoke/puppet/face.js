// Xiao Ke · face. Drawn in rig-local units under the pose transform (see draw.js).
// Canon: two tall ink pills (19×43 at ±40, −14), three blush strokes at ±68, 22, a small mouth.
// Cartoon additions: eyelids (lid/tilt/lidLow), optional floating brows, mouth shapes.
import { TAU, clamp, lerp } from './math.js';
import { FACE } from './palette.js';

const EYE_X = 40, EYE_Y = -14, EYE_W = 20, EYE_H = 44;

function pill(ctx, cx, cy, w, h) {
  const r = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2 + r);
  ctx.arc(cx, cy - h / 2 + r, r, Math.PI, 0);
  ctx.lineTo(cx + w / 2, cy + h / 2 - r);
  ctx.arc(cx, cy + h / 2 - r, r, 0, Math.PI);
  ctx.closePath();
}

/** Where the face sits for this turn: centre shift and near/far eye sizes. */
export function faceFrame(p) {
  const tn = p.turn, at = Math.abs(tn);
  const shift = tn * 40;
  return {
    shift,
    eye(side) {
      const near = tn === 0 ? 1 : side === Math.sign(tn) ? 1 : 0;
      const k = near ? 1 + 0.06 * at : 1 - 0.62 * at;
      const x = side * EYE_X * (near ? 1 - 0.18 * at : 1 - 0.55 * at) + shift;
      return { x, k, hidden: !near && at > 0.92 };
    },
  };
}

function eye(ctx, p, side, F, ink) {
  const E = p.eyes, fr = F.eye(side);
  if (fr.hidden) return;
  const lx = p.look[0], ly = p.look[1];
  const wide = E.wide || 0, size = (E.size ?? 1) * fr.k;
  const ex = fr.x + lx * 13, ey = EYE_Y + ly * 9;
  const ew = EYE_W * (1 + 0.22 * wide) * size * (fr.k < 1 ? 0.92 : 1), eh = EYE_H * (1 + 0.2 * wide) * (E.size ?? 1);
  const mode = E.mode || 'open';
  ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  if (mode === 'happy') { // ^ ^
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = lerp(Math.PI * 1.12, Math.PI * 1.88, i / 14);
      const x = ex + 17 * Math.cos(a) * fr.k, y = ey + 12 + 20 * Math.sin(a);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    return;
  }
  if (mode === 'content') { // ‿ closed, relaxed (sleep, bliss)
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = lerp(Math.PI * 0.15, Math.PI * 0.85, i / 14);
      const x = ex + 15 * Math.cos(a) * fr.k, y = ey + 4 + 9 * Math.sin(a);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    return;
  }
  if (mode === 'squeeze') { // > <
    ctx.lineWidth = 6.5;
    const d = side; // left eye '>' , right eye '<'
    ctx.beginPath();
    ctx.moveTo(ex - d * 11 * fr.k, ey - 12);
    ctx.lineTo(ex + d * 9 * fr.k, ey);
    ctx.lineTo(ex - d * 11 * fr.k, ey + 12);
    ctx.stroke();
    return;
  }
  if (mode === 'spiral') {
    ctx.lineWidth = 4;
    ctx.beginPath();
    const turns = 2.3, ph = (p.t || 0) * 5 * side;
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, a = ph + u * turns * TAU, r = 2 + u * 13;
      const x = ex + Math.cos(a) * r * fr.k, y = ey + Math.sin(a) * r * 1.25;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    return;
  }
  if (mode === 'dot') { // tiny shocked pupils
    ctx.beginPath();
    ctx.ellipse(ex, ey, 6.5 * fr.k, 8, 0, 0, TAU);
    ctx.fill();
    return;
  }

  // open pill with blink / lids
  const blink = clamp(E.blink || 0);
  if (blink > 0.82) {
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(ex - ew * 0.78, ey + 6);
    ctx.quadraticCurveTo(ex, ey + 11, ex + ew * 0.78, ey + 6);
    ctx.stroke();
    return;
  }
  const h = Math.max(6, eh * (1 - 0.92 * blink));
  const cy = ey + (eh - h) * 0.35;
  ctx.save();
  // lids: a tilted upper cut (lid 0..1, tilt + = inner corner down = cross) and a lower cheek push
  const lid = clamp(E.lid || 0), tilt = (E.tilt || 0) * -side, low = clamp(E.lidLow || 0);
  if (lid > 0 || low > 0) {
    const top = cy - h / 2 + h * lid * 0.9;
    const k = Math.tan(tilt);
    ctx.beginPath();
    ctx.moveTo(ex - 60, top - k * 60);
    ctx.lineTo(ex + 60, top + k * 60);
    if (low > 0) { // cheeks push up: the lower edge becomes an upward arch
      const bot = cy + h / 2 - h * low * 0.38;
      ctx.lineTo(ex + 60, bot);
      for (let i = 0; i <= 16; i++) {
        const u = 1 - i / 16, x = ex + (2 * u - 1) * ew * 0.75;
        ctx.lineTo(x, bot - (1 - (2 * u - 1) ** 2) * h * low * 0.22);
      }
      ctx.lineTo(ex - 60, bot);
    } else {
      ctx.lineTo(ex + 60, cy + h);
      ctx.lineTo(ex - 60, cy + h);
    }
    ctx.closePath();
    ctx.clip();
  }
  pill(ctx, ex, cy, ew, h);
  ctx.fill();
  ctx.restore();
  // glints (only when the eye is open enough and not heavily lidded)
  if (h > 16 && lid < 0.55) {
    ctx.fillStyle = FACE.glint;
    const gx = ex - ew * 0.14, gy = cy - h * 0.24 + h * lid * 0.5;
    ctx.beginPath(); ctx.arc(gx, gy, 4.1 * (1 + 0.3 * wide) * Math.min(1, fr.k + 0.2), 0, TAU); ctx.fill();
    ctx.globalAlpha *= 0.8;
    ctx.beginPath(); ctx.arc(ex + ew * 0.16, cy + h * 0.27, 2.0 * (1 + 0.3 * wide), 0, TAU); ctx.fill();
    ctx.globalAlpha /= 0.8;
  }
}

function brows(ctx, p, F, ink) {
  const B = p.brow;
  if (!B || !(B.show > 0)) return;
  ctx.save();
  ctx.globalAlpha *= clamp(B.show);
  ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineWidth = 5;
  for (const side of [-1, 1]) {
    const fr = F.eye(side);
    if (fr.hidden) continue;
    const x = fr.x + p.look[0] * 11, y = EYE_Y - EYE_H / 2 - 13 - (B.raise || 0) * 9 + p.look[1] * 7;
    const a = (B.tilt || 0) * 0.55 * side; // tilt + : inner ends down (cross); - : inner up (worried)
    const L = 10 * Math.max(0.5, fr.k);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L);
    ctx.quadraticCurveTo(x, y - 3 - Math.abs(a) * 2, x + Math.cos(a) * L, y + Math.sin(a) * L);
    ctx.stroke();
  }
  ctx.restore();
}

function blush(ctx, p, F, color) {
  const amt = clamp(p.blush ?? 0, 0, 1.6);
  if (amt <= 0) return;
  for (const side of [-1, 1]) {
    const fr = F.eye(side);
    if (fr.hidden) continue;
    const at = Math.abs(p.turn), near = p.turn === 0 || side === Math.sign(p.turn);
    const bx = fr.x + side * 26 * fr.k * (1 - 0.95 * at) - p.turn * 14 * at + p.look[0] * 6, by = 20 + p.look[1] * 4;
    const vis = near ? 1 : 1 - at;
    if (vis <= 0.02) continue;
    ctx.save();
    ctx.globalAlpha *= 0.22 * Math.min(1, amt) * vis;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(bx, by, 18 * fr.k * (0.8 + 0.25 * amt), 9 * (0.8 + 0.2 * amt), 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= 0.92 * Math.min(1, amt) * vis;
    ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = 3;
    for (const j of [-1, 0, 1]) {
      ctx.beginPath();
      ctx.moveTo(bx + j * 8 * fr.k - 3, by + 5.5);
      ctx.lineTo(bx + j * 8 * fr.k + 3, by - 5.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function mouth(ctx, p, F) {
  const M = p.mouth || {};
  const mode = M.mode || 'smile', amt = M.amt ?? 0.6, open = clamp(M.open ?? 0);
  const mx = F.shift * 0.92 + p.look[0] * 11, my = 17 + p.look[1] * 6;
  const k = 1 - 0.25 * Math.abs(p.turn);
  ctx.strokeStyle = FACE.mouth; ctx.fillStyle = FACE.mouth; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.5;
  if (mode === 'smile' || mode === 'frown') {
    const sgn = mode === 'smile' ? 1 : -1;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = lerp(0.18 * Math.PI, 0.82 * Math.PI, i / 14);
      const x = mx + 10.5 * Math.cos(a) * k, y = my + (sgn > 0 ? 0 : 5) + sgn * 6.5 * amt * Math.sin(a);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  } else if (mode === 'open') { // D-shaped open smile with tongue
    const w = 13 * k * (0.8 + 0.3 * amt), h = 5 + 11 * open;
    ctx.beginPath();
    ctx.moveTo(mx - w, my - 1);
    ctx.quadraticCurveTo(mx, my + 2, mx + w, my - 1);
    ctx.bezierCurveTo(mx + w * 0.9, my + h, mx - w * 0.9, my + h, mx - w, my - 1);
    ctx.closePath();
    ctx.fillStyle = FACE.mouthIn; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = FACE.tongue;
    ctx.beginPath(); ctx.ellipse(mx + 1, my + h * 0.95, w * 0.62, h * 0.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 3; ctx.stroke();
  } else if (mode === 'o') {
    const r = 4 + 4 * amt;
    ctx.beginPath(); ctx.ellipse(mx, my + 3, r * 0.85 * k, r * (1 + 0.4 * open), 0, 0, TAU);
    ctx.fillStyle = FACE.mouthIn; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  } else if (mode === 'flat') {
    ctx.beginPath(); ctx.moveTo(mx - 8 * k, my + 4); ctx.lineTo(mx + 8 * k, my + 4); ctx.stroke();
  } else if (mode === 'wavy') {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = i / 16, x = mx + (u - 0.5) * 24 * k, y = my + 4 + Math.sin(u * TAU * 1.5 + (p.t || 0) * 9) * 2.6 * (0.6 + amt);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  } else if (mode === 'cat') { // ω
    ctx.beginPath();
    ctx.moveTo(mx - 10 * k, my + 1);
    ctx.quadraticCurveTo(mx - 5 * k, my + 9, mx, my + 2);
    ctx.quadraticCurveTo(mx + 5 * k, my + 9, mx + 10 * k, my + 1);
    ctx.stroke();
  }
}

/** Draw the face. ctx must already carry the pose transform (rig-local units). */
export function drawFace(ctx, p) {
  if (!(p.face > 0) || Math.abs(p.turn) > 1.0001) return;
  const F = faceFrame(p);
  ctx.save();
  ctx.globalAlpha *= clamp(p.face);
  blush(ctx, p, F, p.blushColor || FACE.blush);
  for (const side of [-1, 1]) eye(ctx, p, side, F, FACE.eye);
  brows(ctx, p, F, FACE.eye);
  mouth(ctx, p, F);
  ctx.restore();
}
