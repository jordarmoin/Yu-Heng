// Xiao Ke · rig. The canon model (octo-series/lib/octo.py) re-expressed for the cartoon puppet:
// a soft rounded-square body (superellipse 100×80, k 3.3), two tall ink eyes, two stubby side arms,
// four stubby legs, and as many extra arms as a scene needs. Everything here is pure geometry in
// rig-local units (body centre = 0,0; +y down). World transform: pose.x/y, s, sx/sy, rot.
import { TAU, clamp, lerp } from './math.js';

export const RX = 100, RY = 80, BODY_K = 3.3;

/** A full pose. Unset fields fall back to defaults(). */
export function defaults() {
  return {
    x: 0, y: 0, s: 1, rot: 0, sx: 1, sy: 1,      // placement + squash/stretch
    turn: 0,                                     // -1 left profile .. 0 front .. 1 right profile
    t: 0,                                        // life clock (idle wiggle phases)
    wiggle: 1,                                   // idle limb motion amount
    sway: 0,                                     // legs/arms trail (drag), radians-ish
    splay: 0, legLen: 1, armLen: 1,
    walk: null,                                  // walk phase (radians) or null
    legs: null,                                  // null or [4] of limb specs / null
    armL: null, armR: null,                      // null = resting nub; or a limb spec
    extra: [],                                   // extra arm specs (must carry .base in local units)
    // face
    look: [0, 0],                                // gaze -1..1
    eyes: { mode: 'open', blink: 0, wide: 0, lid: 0, tilt: 0, lidLow: 0, size: 1 },
    brow: { show: 0, raise: 0, tilt: 0 },
    mouth: { mode: 'smile', amt: 0.6, open: 0 },
    blush: 0.8,
    face: 1,
    // colour
    skin: null,                                  // full skin object (palette.skinToward) or null = canon
    rim: 0,                                      // white sticker rim 0..1 (dark/busy backgrounds, small sizes)
    alpha: 1,
    shadow: null,                                // { y: groundY, k: 0..1 } contact shadow
  };
}

export function pose(over = {}) {
  const p = defaults();
  for (const k of Object.keys(over)) {
    const v = over[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && p[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) {
      p[k] = { ...p[k], ...v };
    } else p[k] = v;
  }
  return p;
}

// ------------------------------------------------------------------ transforms
export function toWorld(P, p) {
  const c = Math.cos(p.rot), s = Math.sin(p.rot);
  const kx = p.s * p.sx, ky = p.s * p.sy;
  return P.map(([x, y]) => {
    const X = x * kx, Y = y * ky;
    return [X * c - Y * s + p.x, X * s + Y * c + p.y];
  });
}
export function toLocal([wx, wy], p) {
  const dx = wx - p.x, dy = wy - p.y;
  const c = Math.cos(-p.rot), s = Math.sin(-p.rot);
  return [(dx * c - dy * s) / (p.s * p.sx), (dx * s + dy * c) / (p.s * p.sy)];
}

// ------------------------------------------------------------------ shapes
export function superellipse(cx, cy, rx, ry, k = BODY_K, n = 96) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
    out.push([cx + rx * Math.sign(ca) * Math.abs(ca) ** (2 / k), cy + ry * Math.sign(sa) * Math.abs(sa) ** (2 / k)]);
  }
  return out;
}

/** Tentacle centre-line by integrating a direction field (canon limb_fk). */
export function limbFK(base, ang, len, o = {}) {
  const n = o.n ?? 14, w0 = o.w0 ?? 31, w1 = o.w1 ?? 21;
  const curl = o.curl ?? 0, wave = o.wave ?? 0, phase = o.phase ?? 0, sway = o.sway ?? 0, wk = o.waveK ?? 1;
  const pts = [[base[0], base[1]]], w = [w0];
  const seg = len / (n - 1);
  let x = base[0], y = base[1];
  for (let i = 1; i < n; i++) {
    const sp = (i - 1) / (n - 1);
    const th = ang + curl * sp ** 1.6 + sway * sp ** 1.2 + wave * Math.sin(phase - wk * 2.6 * sp) * sp;
    x += Math.cos(th) * seg; y += Math.sin(th) * seg;
    pts.push([x, y]);
    const s = i / (n - 1);
    w.push(w0 + (w1 - w0) * s ** 0.85);
  }
  return { pts, w };
}

/** Tentacle that reaches from base to a local target with a lazy S-bend (canon limb_to). */
export function limbReach(base, target, o = {}) {
  const n = o.n ?? 18, w0 = o.w0 ?? 31, w1 = o.w1 ?? 20, bend = o.bend ?? 0.25;
  const dx = target[0] - base[0], dy = target[1] - base[1];
  const L = Math.hypot(dx, dy) + 1e-6;
  const nx = -dy / L, ny = dx / L;
  const pts = [], w = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const sn = Math.sin(Math.PI * s);
    let x = base[0] + dx * s + nx * sn * bend * L;
    let y = base[1] + dy * s + ny * sn * bend * L;
    if (o.out) { const k = L * 0.22 * sn * sn * (1 - s); x += o.out[0] * k; y += o.out[1] * k; }
    if (o.wave) { const k = o.wave * L * Math.sin((o.phase ?? 0) - 5 * s) * sn; x += nx * k; y += ny * k; }
    if (o.curl) { // curl the last third of the limb (a hand-ish flick at the tip)
      const c = clamp((s - 0.62) / 0.38) ** 2 * o.curl * 26;
      x += nx * c; y += ny * c;
    }
    pts.push([x, y]);
    w.push(w0 + (w1 - w0) * s ** 0.8);
  }
  return { pts, w };
}

/** Closed outline polygon around a centre-line with widths, round tip. */
export function limbOutline(pts, w, tipN = 9) {
  const n = pts.length, L = [], R = [];
  const nrm = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1;
    nrm.push([-dy / ln, dx / ln]);
  }
  for (let i = 0; i < n; i++) {
    const h = w[i] * 0.5;
    L.push([pts[i][0] + nrm[i][0] * h, pts[i][1] + nrm[i][1] * h]);
    R.push([pts[i][0] - nrm[i][0] * h, pts[i][1] - nrm[i][1] * h]);
  }
  const e = pts[n - 1], d = pts[n - 1], p = pts[n - 2];
  const aEnd = Math.atan2(d[1] - p[1], d[0] - p[0]);
  const tip = [];
  for (let k = 1; k < tipN - 1; k++) {
    const a = aEnd + Math.PI / 2 - (Math.PI * k) / (tipN - 1);
    tip.push([e[0] + Math.cos(a) * w[n - 1] * 0.5, e[1] + Math.sin(a) * w[n - 1] * 0.5]);
  }
  return [...L, ...tip, ...R.reverse()];
}

/** Underside strip + sucker positions for a limb (world coords in, world out). */
export function underside(pts, w, from = 0.22, to = 0.97, nSuck = 5) {
  const n = pts.length;
  const nrm = [];
  let my = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1;
    nrm.push([-dy / ln, dx / ln]);
    my += dx / ln;
  }
  // the underside faces down (screen +y); fall back to the inner side of the curl
  let sgn = nrm.reduce((acc, q) => acc + q[1], 0) >= 0 ? 1 : -1;
  const i0 = Math.floor(from * (n - 1)), i1 = Math.floor(to * (n - 1));
  const A = [], B = [];
  for (let i = i0; i <= i1; i++) {
    const q = nrm[i], h = w[i];
    A.push([pts[i][0] - sgn * q[0] * h * 0.05, pts[i][1] - sgn * q[1] * h * 0.05]);
    B.push([pts[i][0] + sgn * q[0] * h * 0.62, pts[i][1] + sgn * q[1] * h * 0.62]);
  }
  const suckers = [];
  for (let j = 0; j < nSuck; j++) {
    const u = lerp(0.34, 0.9, nSuck === 1 ? 0.5 : j / (nSuck - 1));
    const k = Math.floor(u * (n - 1)), q = nrm[k];
    suckers.push({ x: pts[k][0] + sgn * q[0] * w[k] * 0.27, y: pts[k][1] + sgn * q[1] * w[k] * 0.27, r: w[k] * 0.13 });
  }
  return { strip: [...A, ...B.reverse()], suckers };
}

// ------------------------------------------------------------------ build
/**
 * Pose -> geometry in WORLD coordinates.
 * limbs: { pts, w, kind: 'leg'|'arm'|'extra', side, layer: 'back'|'main'|'front', id }
 */
export function build(p) {
  const t = p.t, at = Math.abs(p.turn), tn = p.turn;
  const rx = RX * (1 - 0.14 * at);
  const bodyLocal = superellipse(0, 0, rx, RY, BODY_K);
  const limbs = [];
  const S = p.s;

  // legs ----------------------------------------------------------------
  const xs = [-63, -21, 21, 63];
  xs.forEach((bx0, i) => {
    const side = bx0 < 0 ? -1 : 1;
    const inner = Math.abs(bx0) < 40;
    const bx = bx0 * (1 - 0.32 * at) - tn * 10;
    const spec = p.legs ? p.legs[i] : null;
    const far = tn !== 0 && side === -Math.sign(tn);
    const layer = far && at > 0.4 ? 'back' : 'main';
    if (spec && spec.target) {
      const base = [bx * 0.9, RY - 30];
      const r = limbReach(base, toLocal(spec.target, p), { bend: spec.bend ?? 0.2 * side, w0: spec.w0 ?? 36, w1: spec.w1 ?? 20,
        wave: spec.wave ?? 0, phase: spec.phase ?? t * 4, out: spec.out ?? [side * 0.4, 1], curl: spec.curl ?? 0 });
      limbs.push({ ...r, kind: 'leg', side, layer: spec.layer ?? layer, id: 'leg' + i });
      return;
    }
    let ang = Math.PI / 2 - side * ((inner ? 0.07 : 0.2) + p.splay * (inner ? 0.5 : 1));
    const curl = -side * (inner ? 0.22 : 0.42);
    const wv = 0.2 * p.wiggle;
    const ph = t * 3.1 + i * 1.7;
    let ln = 40 * p.legLen * (spec?.len ?? 1);
    let lift = 0;
    if (p.walk !== null && p.walk !== undefined) {
      const ph2 = p.walk + (i % 2 === 0 ? 0 : Math.PI);
      const st = spec?.stride ?? 1;
      ang += 0.42 * Math.sin(ph2) * st;
      lift = Math.max(0, Math.cos(ph2)) * 9 * st;
      ln *= 1 - 0.14 * Math.max(0, Math.cos(ph2)) * st;
    }
    if (spec?.ang !== undefined) ang = spec.ang;
    const r = limbFK([bx, RY - 18 - lift], ang, Math.max(1, ln), { w0: 37, w1: 28, curl: spec?.curl ?? curl, wave: wv, phase: ph, sway: p.sway });
    limbs.push({ ...r, kind: 'leg', side, layer, id: 'leg' + i });
  });

  // arms ----------------------------------------------------------------
  for (const [side, spec] of [[-1, p.armL], [1, p.armR]]) {
    const far = tn !== 0 && side === -Math.sign(tn);
    const bxx = side * (rx - 14) * (far ? 1 - 0.55 * at : 1) - tn * 6;
    const base = [bxx, 10];
    let layer = far && at > 0.35 ? 'back' : 'main';
    let r;
    if (!spec) {
      const ang = side < 0 ? Math.PI - 0.42 : 0.42;
      r = limbFK(base, ang, Math.max(1, 34 * p.armLen), { w0: 31, w1: 23, curl: side * 0.5, wave: 0.16 * p.wiggle, phase: t * 2.7 + side, sway: p.sway * 0.5 });
    } else if (spec.target) {
      r = limbReach(base, toLocal(spec.target, p), { bend: spec.bend ?? 0.22 * side, w0: spec.w0 ?? 31, w1: spec.w1 ?? 20,
        wave: spec.wave ?? 0, phase: spec.phase ?? t * 4, out: [side, 0], curl: spec.curl ?? 0 });
    } else {
      r = limbFK(base, spec.ang, spec.len ?? 60, { w0: spec.w0 ?? 31, w1: spec.w1 ?? 21, curl: spec.curl ?? 0,
        wave: spec.wave ?? 0, phase: spec.phase ?? t * 4, sway: spec.sway ?? 0 });
    }
    if (spec?.layer) layer = spec.layer;
    limbs.push({ ...r, kind: 'arm', side, layer, id: side < 0 ? 'armL' : 'armR', suckers: spec?.suckers });
  }

  // extra arms ------------------------------------------------------------
  (p.extra || []).forEach((spec, k) => {
    const base = spec.base ?? [0, 20];
    const r = spec.target
      ? limbReach(base, toLocal(spec.target, p), { bend: spec.bend ?? 0.2, w0: spec.w0 ?? 30, w1: spec.w1 ?? 18,
          wave: spec.wave ?? 0, phase: spec.phase ?? t * 4, out: spec.out, curl: spec.curl ?? 0 })
      : limbFK(base, spec.ang, spec.len ?? 60, { w0: spec.w0 ?? 30, w1: spec.w1 ?? 19, curl: spec.curl ?? 0,
          wave: spec.wave ?? 0, phase: spec.phase ?? t * 4 });
    limbs.push({ ...r, kind: 'extra', side: spec.side ?? 1, layer: spec.layer ?? 'main', id: 'extra' + k, suckers: spec.suckers });
  });

  // to world ----------------------------------------------------------------
  const body = toWorld(bodyLocal, p);
  for (const L of limbs) {
    L.pts = toWorld(L.pts, p);
    L.w = L.w.map((v) => v * S * Math.sqrt(p.sx * p.sy));
    L.outline = limbOutline(L.pts, L.w);
  }
  return { body, bodyLocal, limbs, rx };
}
