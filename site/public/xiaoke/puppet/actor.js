// Xiao Ke · the directing API. A scene builds a timeline with chainable verbs, then asks for
// poseAt(t) (a full rig pose) and draws overlays (bubbles, fx) with drawOverlays(ctx, env, t).
// Everything is a pure function of t + seed, so any frame renders alone (parallel, out of order).
//
//   const ke = new Actor({ x: 400, y: 700, s: 1, seed: 7 });
//   ke.wait(0.6).feel('curious').walkTo(900).pointAt([1300, 380], { hold: 1 }).say('这里是大脑。').tap([1200, 600]);
//
// Layers inside poseAt:  placement → mood (face, skin, posture) → life (breath, blinks, gaze, sway)
// → the active body verb (walk / point / tap / wave / hop) → look overrides → speech mouth → ground lock.
import { pose as mkPose, toLocal, RX } from './rig.js';
import { MOODS, blendMood } from './moods.js';
import { SKIN, skinToward } from './palette.js';
import { TAU, clamp, lerp, ease, springStep, wobble, hash, mixHex } from './math.js';
import { drawBubble, bubbleDuration, bubbleVoiceEvents } from './bubble.js';
import { drawFx } from './fx.js';
import { drawXiaoke } from './draw.js';

const FOOT = 118; // body centre → ground, rig units

function mixSkin(a, b, t) { if (t <= 0) return a; if (t >= 1) return b; const o = {}; for (const k of Object.keys(a)) o[k] = mixHex(a[k], b[k], t); return o; }
const skinOf = (spec) => (spec && spec[0] ? skinToward(spec[0], spec[1]) : SKIN);
const env01 = (u, a, b) => clamp(Math.min(u / a, (1 - u) / b)); // ramp in over a, out over b (u in 0..1 units of seconds handled by caller)

export class Actor {
  constructor(o = {}) {
    this.home = { x: o.x ?? 960, y: o.y ?? 700 };
    this.s = o.s ?? 1;
    this.seed = o.seed ?? 1;
    this.rim = o.rim ?? 0;
    this.cursor = 0;
    this.segs = [];
    this.moods = [{ t: 0, mood: o.mood ?? 'neutral', dur: 0 }];
    this.looks = [];
    this.bubbles = [];
    this.fx = [];
    this.pops = [];
    this._x = this.home.x;
    this._blinks = null;
  }

  // ------------------------------------------------------------- authoring
  get duration() { return Math.max(this.cursor, ...this.bubbles.map((b) => b.t0 + b.dur), ...this.looks.map((l) => l.t1)); }
  at(t) { this.cursor = t; return this; }
  _seg(kind, dur, args) { const s = { kind, t0: this.cursor, t1: this.cursor + dur, args, x0: this._x }; this.segs.push(s); this.cursor += dur; return s; }
  wait(d = 1) { this._seg('idle', d, {}); return this; }

  /** walk to x (world px). opts: speed px/s at s=1 */
  walkTo(x, o = {}) {
    const dist = Math.abs(x - this._x);
    if (dist < 1) return this;
    const tempo = MOODS[this.moodNameAt(this.cursor)].tempo;
    const v = (o.speed ?? 250) * this.s * tempo;
    const acc = 0.24, dec = 0.26;
    const cruise = Math.max(0, dist / v - (acc + dec) / 2);
    const move = cruise + acc + dec;
    const seg = this._seg('walk', 0.18 + move + 0.42, { ...o, x0: this._x, x1: x, v, acc, dec, cruise, move });
    this._x = x;
    seg.x1 = x;
    return this;
  }
  pointAt(target, o = {}) { const hold = o.hold ?? 1.2; this._seg('point', 0.32 + hold + 0.34, { target, hold, ...o }); return this; }
  tap(target, o = {}) {
    const s = this._seg('tap', 1.05 + (o.hold ?? 0.1), { target, ...o });
    this.fx.push({ kind: 'ripple', t: s.t0 + 0.4, x: target[0], y: target[1], color: o.color });
    return this;
  }
  wave(o = {}) { this._seg('wave', o.dur ?? 1.6, o); return this; }
  hop(o = {}) {
    const s = this._seg('hop', 0.95, o);
    this.fx.push({ kind: 'dust', t: s.t0 + 0.7, x: this._x, y: this.home.y + FOOT * this.s, s: this.s });
    return this;
  }
  /** change mood; opts.pop (default true) adds a little body reaction; opts.hold advances time */
  feel(mood, o = {}) {
    if (!MOODS[mood]) throw new Error('unknown mood ' + mood);
    this.moods.push({ t: this.cursor, mood, dur: o.dur ?? 0.36 });
    if (o.pop !== false) this.pops.push({ t: this.cursor, k: o.pop ?? (mood === 'shock' ? 1.6 : mood === 'joy' ? 1.2 : 0.7) });
    if (mood === 'nervous') this.fx.push({ kind: 'sweat', t: this.cursor + 0.2, follow: true });
    if (mood === 'joy' || mood === 'proud') this.fx.push({ kind: 'sparkle', t: this.cursor + 0.15, follow: true });
    if (o.hold) this.wait(o.hold);
    return this;
  }
  lookAt(target, o = {}) { this.looks.push({ t0: this.cursor, t1: this.cursor + (o.dur ?? 1.4), target }); if (o.wait) this.wait(o.dur ?? 1.4); return this; }
  /** speech bubble. opts: { style: speech|think|shout|code|whisper, box: [x,y] top-left, w, hold, wait } */
  say(text, o = {}) {
    const b = { t0: this.cursor, text, ...o };
    b.dur = bubbleDuration(b);
    this.bubbles.push(b);
    if (o.wait) this.cursor += b.dur - 0.2;
    return this;
  }

  /** Audible typing events, in actor timeline seconds. */
  voiceEvents() {
    return this.bubbles.flatMap(bubbleVoiceEvents).sort((a, b) => a.t - b.t);
  }

  // ------------------------------------------------------------- state lookups
  moodNameAt(t) { let m = this.moods[0].mood; for (const e of this.moods) if (e.t <= t) m = e.mood; return m; }
  moodAt(t) {
    let prev = this.moods[0], cur = this.moods[0];
    for (const e of this.moods) if (e.t <= t) { prev = cur; cur = e; }
    if (cur === prev || t >= cur.t + cur.dur) return { m: blendMood(cur.mood, cur.mood, 1), u: 1, swapAt: null };
    const u = clamp((t - cur.t) / cur.dur);
    const M = blendMood(prev.mood, cur.mood, ease.inOut(u));
    return { m: M, u, swapAt: M.swap ? cur.t + cur.dur * 0.5 : null };
  }
  _lifeTime(t) { // integral of tempo, so tempo changes never jump the idle phases
    let lt = 0; const dt = 1 / 60;
    for (let x = 0; x < t; x += dt) lt += this.moodAt(x).m.tempo * Math.min(dt, t - x);
    return lt;
  }
  _blinkAt(t) {
    if (!this._blinks) {
      const b = []; let x = 0.7 + hash(this.seed * 31) * 1.5, k = 0;
      while (x < 600) { b.push(x); if (hash(this.seed * 977 + k * 13) < 0.18) b.push(x + 0.24); x += 2.2 + hash(this.seed * 131 + k * 7) * 3.2; k++; }
      this._blinks = b;
    }
    let v = 0;
    for (const t0 of this._blinks) { if (t0 > t) break; if (t < t0 + 0.17) v = Math.max(v, Math.sin(Math.PI * (t - t0) / 0.17) ** 0.6); }
    return v;
  }
  _saccade(t) { // little gaze jumps; held 0.7–2.4 s, snap in 70 ms
    let tk = 0, k = 0, prev = [0, 0], cur = [0, 0], start = 0;
    while (tk <= t) { prev = cur; start = tk; cur = [(hash(this.seed * 17 + k * 3) - 0.5) * 0.7, (hash(this.seed * 29 + k * 5) - 0.5) * 0.45]; tk += 0.7 + hash(this.seed * 41 + k) * 1.7; k++; }
    const u = clamp((t - start) / 0.07);
    return [lerp(prev[0], cur[0], u), lerp(prev[1], cur[1], u)];
  }
  xAt(t) {
    let x = this.home.x;
    for (const s of this.segs) {
      if (s.x1 === undefined || s.t0 > t) continue;
      if (t >= s.t1) { x = s.x1; continue; }
      if (s.kind === 'walk') x = s.args.x0 + Math.sign(s.args.x1 - s.args.x0) * this._walkDist(s, t - s.t0 - 0.18);
      else { const f = DEFS[s.kind]?.xAt; x = f ? f(s, t - s.t0, this) : s.x0 + (s.x1 - s.x0) * ease.inOut((t - s.t0) / (s.t1 - s.t0)); }
    }
    return x;
  }
  _walkDist(s, τ) { // trapezoid velocity profile
    const { v, acc, dec, cruise, x0, x1 } = s.args, D = Math.abs(x1 - x0);
    if (τ <= 0) return 0;
    if (τ < acc) return 0.5 * v * τ * τ / acc;
    if (τ < acc + cruise) return 0.5 * v * acc + v * (τ - acc);
    const τd = τ - acc - cruise;
    if (τd < dec) return Math.min(D, 0.5 * v * acc + v * cruise + v * τd - 0.5 * v * τd * τd / dec);
    return D;
  }

  // ------------------------------------------------------------- the pose
  restArm(side, lt, M) {
    const raise = M.posture.arm || 0;
    return { ang: side < 0 ? Math.PI - 0.42 + raise * 0.9 : 0.42 - raise * 0.9, len: 34 * (1 + 0.35 * Math.max(0, raise)), w0: 31, w1: 23,
      curl: side * 0.5, wave: 0.16 * M.wiggle, phase: lt * 2.7 + side };
  }
  /** FK arm spec whose tip lands on a world target (curl compensated). */
  aimArm(P, side, target, curl = 0, reach = 1) {
    const rx = RX * (1 - 0.14 * Math.abs(P.turn));
    const base = [side * (rx - 14) - P.turn * 6, 10];
    const L = toLocal(target, P);
    const dx = L[0] - base[0], dy = L[1] - base[1];
    let len = Math.hypot(dx, dy) * reach;
    const ang = Math.atan2(dy, dx) - curl * 0.38;
    len = clamp(len / (1 - 0.045 * curl * curl), 26, 190);
    return { ang, len, w0: 31, w1: 19, curl, wave: 0, phase: 0 };
  }

  poseAt(t) {
    const s = this.s;
    const { m: M, swapAt } = this.moodAt(t);
    const lt = this._lifeTime(t);
    const P = mkPose({ x: this.xAt(t), y: this.home.y, s, t: lt, rim: this.rim });
    // mood ------------------------------------------------------------------
    P.eyes = { ...M.eyes, blink: 0 }; P.brow = { ...M.brow }; P.mouth = { ...M.mouth }; P.blush = M.blush;
    P.skin = M.skinA !== undefined ? mixSkin(skinOf(M.skinA), skinOf(M.skinB), M.skinT) : skinOf(M.skin);
    P.wiggle = M.wiggle;
    const po = M.posture;
    let sy = 1 + po.sy, rot = po.rot, lift = 0;
    P.splay = po.splay;
    P.armL = this.restArm(-1, lt, M); P.armR = this.restArm(1, lt, M);
    // life --------------------------------------------------------------------
    const br = Math.sin((TAU * lt) / 3.4);
    sy *= 1 + 0.016 * br;
    rot += 0.022 * wobble(lt * 0.35, this.seed) * M.bounce;
    let blink = this._blinkAt(t);
    if (swapAt !== null && Math.abs(t - swapAt) < 0.09) blink = Math.max(blink, Math.sin(Math.PI * (0.5 + (t - swapAt) / 0.18)) ** 0.5);
    P.eyes.blink = blink;
    const sc = this._saccade(t);
    P.look = [sc[0] * 0.35 * M.gaze, sc[1] * 0.3 * M.gaze];
    // reaction pops (feel) -------------------------------------------------------
    for (const p of this.pops) {
      const τ = t - p.t;
      if (τ < 0 || τ > 1.2) continue;
      sy *= 1 + 0.07 * p.k * Math.exp(-5 * τ) * Math.sin(TAU * 2.4 * τ + 0.4);
      lift += 10 * p.k * s * Math.max(0, Math.sin(Math.PI * clamp(τ / 0.32))) * (p.k > 1 ? 1 : 0.5);
    }
    // body verb -------------------------------------------------------------------
    const seg = this.segAt(t);
    if (seg) {
      const τ = t - seg.t0, D = seg.t1 - seg.t0;
      const r = VERBS[seg.kind]?.(this, P, seg, τ, D, M, lt) || {};
      sy *= r.sy ?? 1; rot += r.rot ?? 0; lift += r.lift ?? 0;
    }
    // look overrides --------------------------------------------------------------
    for (const L of this.looks) {
      if (t < L.t0 || t > L.t1) continue;
      const e = clamp(Math.min((t - L.t0) / 0.18, (L.t1 - t) / 0.25));
      const dx = L.target[0] - P.x, dy = L.target[1] - (P.y - 20 * s);
      const d = Math.hypot(dx, dy) || 1;
      P.look = [lerp(P.look[0], (dx / d) * 0.95, e), lerp(P.look[1], (dy / d) * 0.8, e)];
      P.turn += Math.sign(dx) * 0.14 * e;
    }
    // speech: a soft mouth flap while a bubble types ---------------------------------
    for (const b of this.bubbles) {
      const τ = t - b.t0 - 0.2, typing = (b.text.length / (b.cps ?? 14));
      if (τ < 0 || τ > typing) continue;
      if (P.mouth.mode === 'smile' || P.mouth.mode === 'cat' || P.mouth.mode === 'flat') P.mouth.mode = 'open';
      P.mouth.open = Math.max(P.mouth.open, 0.12 + 0.32 * Math.abs(Math.sin(τ * 13 + Math.sin(τ * 5))));
    }
    // ground lock: squash/stretch keeps the feet planted ---------------------------------
    P.sy = sy; P.sx = 1 / Math.sqrt(Math.max(0.3, sy));
    P.rot += rot;
    P.y = this.home.y - (sy - 1) * FOOT * s - lift + (po.drop || 0) * 5 * s;
    P.shadow = { y: this.home.y + FOOT * s, k: 1 };
    return P;
  }

  // ------------------------------------------------------------- drawing
  segAt(t) { return this.segs.find((g) => t >= g.t0 && t < g.t1) || null; }
  /** Draw Xiao Ke + the active verb's props (behind/front) + bubbles and fx. The normal way to draw an actor. */
  draw(ctx, env, t, opts = {}) {
    const P = this.poseAt(t), seg = this.segAt(t), def = seg ? DEFS[seg.kind] : null, τ = seg ? t - seg.t0 : 0;
    def?.behind?.(ctx, this, seg, τ, P);
    const r = drawXiaoke(ctx, env, P);
    def?.front?.(ctx, this, seg, τ, P, r?.geo);
    this.drawOverlays(ctx, env, t, opts);
    return { P, geo: r?.geo };
  }

  // ------------------------------------------------------------- overlays
  headAt(t) { const P = this.poseAt(t); return { x: P.x + P.turn * 30 * P.s, y: P.y - 86 * P.s * P.sy, P }; }
  drawOverlays(ctx, env, t, opts = {}) {
    for (const e of this.fx) {
      const τ = t - e.t;
      if (τ < 0 || τ > 2) continue;
      const anchor = e.follow ? this.headAt(e.t + Math.min(τ, 0.01)) : null;
      drawFx(ctx, { ...e, x: e.follow ? anchor.x : e.x, y: e.follow ? anchor.y : e.y, s: e.s ?? this.s }, τ);
    }
    for (const b of this.bubbles) {
      const τ = t - b.t0;
      if (τ < 0 || τ > b.dur) continue;
      const H = this.headAt(t);
      drawBubble(ctx, b, τ, { tip: [H.x + (b.tipDx ?? 34) * this.s, H.y - (b.tipDy ?? 16) * this.s], s: opts.bubbleScale ?? 1, frame: [env.width, env.height] });
    }
  }
}

// ---------------------------------------------------------------- verbs
// Each verb edits P in place (arms, turn, look, walk, legs, eyes...) and returns multiplicative sy,
// additive rot/lift. τ = seconds into the verb, D = its duration.
export const VERBS = {
  idle() { return {}; },

  walk(A, P, seg, τ, D, M) {
    const a = seg.args, dir = Math.sign(a.x1 - a.x0), s = A.s;
    const start = 0.18, mv = a.move, end = start + mv;
    const e = clamp(Math.min(τ / 0.22, (D - τ) / 0.32)); // envelope for turn/lean/stride
    const dist = A._walkDist(seg, τ - start);
    const stride = 78 * s * (0.85 + 0.15 * M.bounce);
    const φ = (dist / stride) * TAU;
    const moving = τ > start && τ < end;
    const se = clamp(Math.min((τ - start) / 0.2, (end - τ) / 0.2));
    P.walk = φ; P.legs = [0, 1, 2, 3].map(() => ({ stride: se }));
    P.turn = dir * 0.42 * e;
    P.look = [dir * 0.55 * e + P.look[0] * (1 - e), P.look[1] * (1 - e) + 0.05 * e];
    P.sway = -dir * 0.22 * se;
    P.armL.ang += 0.38 * Math.sin(φ) * se; P.armR.ang += 0.38 * Math.sin(φ + Math.PI) * se;
    P.armL.len *= 1 + 0.12 * se; P.armR.len *= 1 + 0.12 * se;
    let sy = 1 + 0.045 * Math.cos(2 * φ) * se * M.bounce;
    let lift = Math.abs(Math.sin(φ)) * 7 * s * se * M.bounce;
    let rot = dir * 0.075 * se;
    if (τ < start) { const u = τ / start; sy *= 1 - 0.07 * Math.sin(Math.PI * u); rot -= dir * 0.05 * Math.sin(Math.PI * u); }
    if (τ > end) { // stop: lean overshoots forward then settles
      const k = τ - end;
      rot += dir * 0.09 * Math.exp(-5 * k) * Math.sin(TAU * 1.6 * k + 0.6);
      sy *= 1 - 0.05 * Math.exp(-6 * k) * Math.cos(TAU * 2 * k);
    }
    return { sy, rot, lift };
  },

  point(A, P, seg, τ, D, M) {
    const a = seg.args, tg = a.target;
    const side = a.side ?? (tg[0] >= P.x ? 1 : -1);
    const inT = 0.32, outT = 0.34;
    const u = τ < inT ? ease.outBack(τ / inT, 2.2) : τ > D - outT ? 1 - ease.inOut((τ - (D - outT)) / outT) : 1;
    P.turn += side * 0.16 * clamp(u);
    const aim = A.aimArm(P, side, tg, -side * 0.55, 0.55);
    aim.len = Math.min(aim.len, 96) * (1 + 0.07 * Math.sin(Math.PI * clamp(τ / 0.45))); aim.w1 = 22;
    const key = side < 0 ? 'armL' : 'armR', other = side < 0 ? 'armR' : 'armL';
    P[key] = lerpArm(P[key], aim, u);
    P[other].ang += side * 0.25 * u; // the free arm lifts a little, like a hand on the chest
    const dx = tg[0] - P.x, dy = tg[1] - P.y, d = Math.hypot(dx, dy) || 1;
    P.look = [lerp(P.look[0], (dx / d) * 0.95, clamp(u)), lerp(P.look[1], (dy / d) * 0.8, clamp(u))];
    P.brow = { ...P.brow, show: Math.max(P.brow.show, 0.6 * clamp(u)), raise: P.brow.raise + 0.4 * clamp(u) };
    return { rot: side * 0.05 * u, sy: 1 + 0.03 * clamp(u) };
  },

  tap(A, P, seg, τ, D, M) {
    const a = seg.args, tg = a.target;
    const side = a.side ?? (tg[0] >= P.x ? 1 : -1);
    const key = side < 0 ? 'armL' : 'armR';
    const pre = [tg[0] - side * 26 * A.s, tg[1] - 46 * A.s];
    const T1 = 0.3, T2 = 0.4, T3 = 0.4 + 0.12 + (a.hold ?? 0.1), T4 = D;
    let w, target, curl = -side * 0.35, effort = 0;
    if (τ < T1) { w = ease.outCubic(τ / T1); target = pre; }                                         // reach above, wind up
    else if (τ < T2) { const u = ease.in((τ - T1) / (T2 - T1)); w = 1; target = [lerp(pre[0], tg[0], u), lerp(pre[1], tg[1], u)]; curl = lerp(curl, 0, u); effort = u; } // tap!
    else if (τ < T3) { w = 1; target = tg; curl = 0; effort = 1 - 0.5 * clamp((τ - T2) / 0.12); }   // press + hold
    else { const u = ease.inOut((τ - T3) / (T4 - T3)); w = 1 - u; target = [lerp(tg[0], pre[0], Math.min(1, u * 2)), lerp(tg[1], pre[1], Math.min(1, u * 2))]; }
    P[key] = lerpArm(P[key], A.aimArm(P, side, target, curl, 1), w);
    P.turn += side * 0.12 * w;
    const dx = tg[0] - P.x, dy = tg[1] - P.y, d = Math.hypot(dx, dy) || 1;
    P.look = [lerp(P.look[0], (dx / d), w), lerp(P.look[1], (dy / d) * 0.9, w)];
    P.eyes = { ...P.eyes, lidLow: Math.max(P.eyes.lidLow, 0.35 * effort) };
    P.mouth = effort > 0.5 ? { ...P.mouth, mode: 'flat' } : P.mouth;
    const press = τ >= T2 && τ < T2 + 0.16 ? Math.sin(Math.PI * (τ - T2) / 0.16) : 0;
    return { rot: side * (0.06 * w + 0.04 * press) - side * 0.04 * (τ < T1 ? Math.sin(Math.PI * τ / T1) : 0), sy: 1 - 0.05 * press };
  },

  wave(A, P, seg, τ, D, M) {
    const side = seg.args.side ?? 1, key = side < 0 ? 'armL' : 'armR';
    const u = clamp(Math.min(τ / 0.25, (D - τ) / 0.3));
    const wv = Math.sin(TAU * 2.1 * (τ - 0.2));
    const up = { ang: side < 0 ? -Math.PI + 0.62 : -0.62, len: 70, w0: 32, w1: 21, curl: -side * (0.62 + 0.42 * wv), wave: 0, phase: 0 };
    up.ang += side * 0.2 * wv;
    P[key] = lerpArm(P[key], up, ease.inOut(u));
    P.turn += side * 0.08 * u;
    return { rot: -side * 0.035 * wv * u, sy: 1 + 0.02 * u };
  },

  hop(A, P, seg, τ, D, M) {
    const s = A.s, b = seg.args.height ?? 1;
    const T1 = 0.16, T2 = 0.62, H = 78 * s * b * (0.7 + 0.3 * M.bounce);
    let sy = 1, lift = 0;
    if (τ < T1) sy = 1 - 0.17 * Math.sin((Math.PI / 2) * (τ / T1));                                // crouch
    else if (τ < T2) {                                                                          // air
      const u = (τ - T1) / (T2 - T1);
      lift = 4 * H * u * (1 - u);
      sy = 1 + 0.16 * (1 - u) * (1 - u) - 0.04 * u;
      P.legLen = 1 + 0.35 * Math.sin(Math.PI * u); P.splay = 0.18 * Math.sin(Math.PI * u);
      P.armL.ang += 0.9 * Math.sin(Math.PI * u); P.armR.ang -= 0.9 * Math.sin(Math.PI * u);
    } else {                                                                                    // land + settle
      const k = τ - T2;
      sy = 1 - 0.2 * Math.exp(-9 * k) * Math.cos(TAU * 2.2 * k);
    }
    return { sy, lift };
  },
};

export function lerpArm(a, b, t) {
  if (t <= 0) return a; if (t >= 1) return { ...b };
  let da = b.ang - a.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
  return { ang: a.ang + da * t, len: lerp(a.len, b.len, t), w0: lerp(a.w0 ?? 31, b.w0 ?? 31, t), w1: lerp(a.w1 ?? 21, b.w1 ?? 21, t),
    curl: lerp(a.curl ?? 0, b.curl ?? 0, t), wave: lerp(a.wave ?? 0, b.wave ?? 0, t), phase: a.phase ?? 0, sway: 0 };
}

// ---------------------------------------------------------------- extension point
// New verbs live in puppet/verbs/<name>.js and register here; never edit the kernel verbs above.
//   defineVerb('present', { dur: (o) => 0.4 + (o.hold ?? 1) + 0.4, apply(A, P, seg, τ, D, M, lt) { ...; return { sy, rot, lift }; },
//                           fx: (o, seg, A) => [{ kind: 'sparkle', t: seg.t0 + 0.3, follow: true }],
//                           behind(ctx, A, seg, τ, P) {}, front(ctx, A, seg, τ, P, geo) {} });
//   ke.present({ hold: 1.2 })
export const DEFS = {};
export function defineVerb(name, def) {
  if (Actor.prototype[name] && !DEFS[name]) throw new Error(`verb name clashes with Actor method: ${name}`);
  DEFS[name] = def;
  VERBS[name] = def.apply;
  Actor.prototype[name] = function (o = {}) {
    const d = typeof def.dur === 'function' ? def.dur(o, this) : def.dur;
    const seg = this._seg(name, d, o);
    if (def.moveTo !== undefined) { const x = typeof def.moveTo === 'function' ? def.moveTo(o, this) : def.moveTo; if (x !== null && x !== undefined) { seg.x1 = x; this._x = x; } }
    if (def.fx) for (const e of def.fx(o, seg, this)) this.fx.push(e);
    return this;
  };
}

/** World tip of a limb from drawXiaoke's geo: { x, y, ang } (ang = direction of the last segment). */
export function tipOf(geo, id) {
  const L = geo?.limbs?.find((l) => l.id === id);
  if (!L) return null;
  const a = L.pts[L.pts.length - 2], b = L.pts[L.pts.length - 1];
  return { x: b[0], y: b[1], ang: Math.atan2(b[1] - a[1], b[0] - a[0]), w: L.w[L.w.length - 1] };
}
