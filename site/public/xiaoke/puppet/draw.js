// Xiao Ke · cel renderer (style C, owner-approved 2026-11-20) with the optional sticker rim from style A.
// Canvas2D subset only (render/SUBSET.md). The whole character is painted into one offscreen layer, so
// fades, ink-teleports and camouflage act on Xiao Ke as one object.
//
// Paint order inside the layer:  rim → weighted line → [paint: base · cast · underside · shade · highlight
// · gloss · suckers] → face → front limbs (own line + paint).
import { build, toWorld } from './rig.js';
import { SKIN, FACE } from './palette.js';
import { drawFace } from './face.js';
import { TAU, clamp } from './math.js';

const LIGHT = { shade: [-13, -12], high: [6, 7], cast: 13, lineShift: [2.2, 2.6] };
export const STYLE = { line: 3.3, rim: 7, minLine: 1.4 };

// ---------------------------------------------------------------- paths
function area(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }
/** smooth closed curve through the midpoints of a polygon, always the same winding (nonzero = union) */
function trace(path, P, dx = 0, dy = 0) {
  const Q = area(P) < 0 ? P.slice().reverse() : P;
  const n = Q.length;
  const m0x = (Q[n - 1][0] + Q[0][0]) / 2 + dx, m0y = (Q[n - 1][1] + Q[0][1]) / 2 + dy;
  path.moveTo(m0x, m0y);
  for (let i = 0; i < n; i++) {
    const a = Q[i], b = Q[(i + 1) % n];
    path.quadraticCurveTo(a[0] + dx, a[1] + dy, (a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy);
  }
  path.closePath();
}
function polyPath(polys, dx = 0, dy = 0) { const p = new Path2D(); for (const P of polys) trace(p, P, dx, dy); return p; }
function straight(P) { const p = new Path2D(); p.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) p.lineTo(P[i][0], P[i][1]); p.closePath(); return p; }

function bounds(polys, pad) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const P of polys) for (const [x, y] of P) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return { x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: Math.ceil(x1 - x0 + 2 * pad), h: Math.ceil(y1 - y0 + 2 * pad) };
}

// ---------------------------------------------------------------- layers
function layer(env, B, k) {
  const c = env.createCanvas(Math.max(1, Math.ceil(B.w * k)), Math.max(1, Math.ceil(B.h * k)));
  const g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, -B.x * k, -B.y * k);
  return { c, g };
}
function blit(dst, src) { dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.drawImage(src, 0, 0); dst.restore(); }

/** Paint one group of shapes (silhouette parts) with the full cel treatment. */
function paintGroup(env, g, B, k, grp, skin, s, opts) {
  const sil = polyPath(grp.polys);
  const lw = Math.max(STYLE.minLine, STYLE.line * s);
  // rim + line (under the paint; the paint covers every inner edge, so only the union's outline shows)
  if (opts.rim > 0) {
    g.save();
    g.globalAlpha *= clamp(opts.rim);
    g.strokeStyle = FACE.rim; g.fillStyle = FACE.rim; g.lineJoin = 'round';
    g.lineWidth = 2 * (lw + STYLE.rim * Math.max(0.55, s));
    g.stroke(sil); g.fill(sil);
    g.restore();
  }
  g.fillStyle = skin.line;
  g.fill(polyPath(grp.polys, LIGHT.lineShift[0] * s, LIGHT.lineShift[1] * s));
  g.strokeStyle = skin.line; g.lineJoin = 'round'; g.lineWidth = 2 * lw;
  g.stroke(sil);

  // paint layer
  const P = layer(env, B, k), o = P.g;
  o.fillStyle = skin.base; o.fill(sil);
  o.globalCompositeOperation = 'source-atop';
  if (grp.body) { // cast shadow of the body onto the legs
    const cast = polyPath([grp.body], 0, LIGHT.cast * s);
    o.fillStyle = skin.shade2; o.fill(cast);
    o.fillStyle = skin.base; o.fill(polyPath([grp.body]));
  }
  for (const L of grp.limbs) if (L.under) { o.fillStyle = skin.under; o.fill(straight(L.under.strip)); }
  // cel shade crescent: silhouette minus itself shifted towards the light
  const S = layer(env, B, k), sg = S.g;
  sg.fillStyle = skin.shade; sg.fill(sil);
  sg.globalCompositeOperation = 'destination-out';
  sg.fill(polyPath(grp.polys, LIGHT.shade[0] * s, LIGHT.shade[1] * s));
  blit(o, S.c);
  if (grp.body) { // highlight band on the body's lit edge
    const H = layer(env, B, k), hg = H.g;
    hg.fillStyle = skin.light; hg.fill(polyPath([grp.body]));
    hg.globalCompositeOperation = 'destination-out';
    hg.fill(polyPath([grp.body], LIGHT.high[0] * s, LIGHT.high[1] * s));
    blit(o, H.c);
    // gloss ticks on the head (follow the body transform)
    o.fillStyle = skin.gloss;
    o.fill(polyPath([grp.gloss1]));
    o.beginPath(); o.arc(grp.gloss2[0], grp.gloss2[1], 3.6 * s, 0, TAU); o.fill();
  }
  o.globalCompositeOperation = 'source-over';
  for (const L of grp.limbs) if (L.under) for (const q of L.under.suckers) {
    o.fillStyle = skin.sucker;
    o.beginPath(); o.arc(q.x, q.y, q.r, 0, TAU); o.fill();
    o.strokeStyle = skin.suckerRing; o.lineWidth = Math.max(0.8, 1.3 * s);
    o.stroke();
  }
  blit(g, P.c);
}

function ellipsePts(cx, cy, rx, ry, rot, n = 24) {
  const out = [], c = Math.cos(rot), sn = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, x = rx * Math.cos(a), y = ry * Math.sin(a); out.push([cx + x * c - y * sn, cy + x * sn + y * c]); }
  return out;
}

/** Contact shadow on the ground (drawn straight onto ctx, under the character). */
function contactShadow(ctx, p) {
  if (!p.shadow) return;
  const gy = p.shadow.y, k = p.shadow.k ?? 1;
  const hgt = Math.max(0, gy - (p.y + 118 * p.s));
  const f = 1 / (1 + hgt / (160 * p.s));
  ctx.save();
  ctx.globalAlpha *= 0.13 * k * f * p.alpha;
  ctx.fillStyle = '#29231f';
  ctx.beginPath(); ctx.ellipse(p.x, gy, 112 * p.s * (0.55 + 0.45 * f), 11 * p.s * (0.6 + 0.4 * f), 0, 0, TAU); ctx.fill();
  ctx.restore();
}

/**
 * Draw Xiao Ke.
 * @param ctx  Canvas2D (subset)
 * @param env  scene env (createCanvas, scale)
 * @param p    full pose (rig.pose())
 */
export function drawXiaoke(ctx, env, p) {
  if (!(p.alpha > 0)) return;
  const skin = p.skin || SKIN;
  const geo = build(p);
  const s = p.s;
  for (const L of geo.limbs) {
    const want = L.suckers ?? (L.kind !== 'leg');
    L.under = want && L.pts.length > 2 && arcLen(L.pts) > 70 * s ? underside(L) : null;
  }
  const mainLimbs = geo.limbs.filter((L) => L.layer !== 'front');
  const frontLimbs = geo.limbs.filter((L) => L.layer === 'front');
  const gloss1 = toWorld(ellipsePts(-56, -52, 14, 6.5, -0.5), p);
  const gloss2 = toWorld([[-33, -60]], p)[0];
  const main = { polys: [...mainLimbs.map((L) => L.outline), geo.body], limbs: mainLimbs, body: geo.body, gloss1, gloss2 };

  const pad = (STYLE.line + STYLE.rim + 6) * Math.max(1, s) + 4;
  const B = bounds([...main.polys, ...frontLimbs.map((L) => L.outline)], pad);
  const k = env.scale || 1;
  const C = layer(env, B, k), g = C.g;

  paintGroup(env, g, B, k, main, skin, s, { rim: p.rim });
  // face, under the pose transform (rig-local units)
  g.save();
  g.translate(p.x, p.y); g.rotate(p.rot); g.scale(s * p.sx, s * p.sy);
  drawFace(g, p);
  g.restore();
  for (const L of frontLimbs) paintGroup(env, g, B, k, { polys: [L.outline], limbs: [L] }, skin, s, { rim: 0 });

  contactShadow(ctx, p);
  ctx.save();
  ctx.globalAlpha *= clamp(p.alpha);
  ctx.drawImage(C.c, 0, 0, C.c.width, C.c.height, B.x, B.y, C.c.width / k, C.c.height / k);
  ctx.restore();
  return { bounds: B, geo };
}

import { underside as rigUnderside } from './rig.js';
function underside(L) { return rigUnderside(L.pts, L.w); }
function arcLen(P) { let s = 0; for (let i = 1; i < P.length; i++) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return s; }
