import { Actor, defineVerb, lerpArm, tipOf } from '../actor.js';
import { TAU, clamp, ease, lerp } from '../math.js';
import { PROPS } from '../props/index.js';
import { toWorld } from '../rig.js';

export function register(name, def, positional) {
  const { duration = 1.4, ...hooks } = def;
  defineVerb(name, {
    ...hooks,
    dur: (options, actor) => {
      const tempo = actor.moodAt(actor.cursor).m.tempo;
      return Math.max(0.65, typeof duration === 'function' ? duration(options, actor, tempo) : (options.dur ?? duration) / tempo);
    },
    apply(actor, pose, segment, time, duration, mood, life) {
      if (time <= 0 || time >= duration) return {};
      const u = time / duration;
      const settle = Math.min(0.34, duration * 0.34);
      const rise = Math.min(0.24, duration * 0.32);
      const w = time < rise ? ease.outBack(time / rise) : ease.inOut((duration - time) / settle);
      const lead = ease.inOut(time / 0.12) * ease.inOut((duration - time) / settle);
      const arm = w * ease.inOut((time - 0.12) / Math.min(0.18, duration * 0.2));
      return hooks.apply({ actor, pose, segment, a: segment.args, t: time, D: duration, u, w, lead, arm, mood, life,
        energy: w * (0.65 + 0.35 * mood.bounce), phase: u * TAU });
    },
  });
  if (positional) {
    const registered = Actor.prototype[name];
    Actor.prototype[name] = function (first, ...rest) {
      const options = first === undefined || (first && typeof first === 'object' && !Array.isArray(first))
        ? first : positional(first, ...rest);
      return registered.call(this, options);
    };
  }
}

export const armKey = side => side < 0 ? 'armL' : 'armR';
export const direction = side => side === 'left' || side === 'bottom' || side === -1 ? -1 : 1;
export const xTarget = x => ({ x });
export const targetArg = target => ({ target });

export function gesture(p, side, w, angle, length = 75, curl = -side * 0.7, front = false) {
  const key = armKey(side);
  p[key] = lerpArm(p[key], { ang: side < 0 ? Math.PI - angle : angle, len: length, curl, w0: 31, w1: 19 }, w);
  if (front && w > 0.18) p[key].layer = 'front';
}

export function local(p, x, y) {
  return [p.x + x * p.s, p.y + y * p.s];
}

export function look(p, target, w) {
  const dx = target[0] - p.x, dy = target[1] - p.y;
  const d = Math.max(30, Math.hypot(dx, dy));
  p.look = [lerp(p.look[0], dx / d, clamp(w)), lerp(p.look[1], dy / d * 0.84, clamp(w))];
}

export function reach(c, target, weight = c.arm, curl = 0.5, front = false, side = Math.sign(target[0] - c.pose.x) || 1, exact = false) {
  const p = c.pose, k = armKey(side);
  look(p, target, c.lead);
  const spec = c.actor.aimArm(p, side, target, -side * curl);
  p[k] = lerpArm(p[k], spec, weight);
  if (weight > 0.18 && front) p[k].layer = 'front';
  if (exact && weight >= 1) p[k].target = target;
  return side;
}

export function face(p, w, eyes, mouth) {
  if (w > 0.42 && w < 0.71) p.eyes.blink = Math.max(p.eyes.blink, Math.sin(Math.PI * (w - 0.42) / 0.29));
  if (w >= 0.56) {
    if (eyes) p.eyes.mode = eyes;
    if (mouth) p.mouth.mode = mouth;
  }
}

export function emit(kind, fraction, fields = {}) {
  return (a, seg, actor) => [{
    kind, t: lerp(seg.t0, seg.t1, fraction),
    ...(typeof fields === 'function' ? fields(a, seg, actor) : fields),
  }];
}

export const atHead = { follow: true };
export const ground = (a, seg, actor) => ({ x: seg.x1 ?? seg.x0, y: actor.home.y + actor.s * 118 });
export const atTarget = (a, seg, actor) => {
  const [x, y] = a.target ?? [seg.x0 + 156 * actor.s, actor.home.y];
  return { x, y };
};
export const travel = (a, actor) => a.x ?? actor._x + direction(a.side) * 125 * actor.s;

export function gait(c, { stride, turn, bounce, lean }) {
  const { pose: p, segment: seg, u, w, energy } = c;
  const side = Math.sign(seg.x1 - seg.x0) || 1;
  const phase = Math.abs(p.x - seg.x0) / (stride * p.s) * TAU;
  look(p, local(p, side * 140, 0), c.lead);
  p.turn = side * turn * w;
  p.walk = phase;
  p.legs = Array.from({ length: 4 }, () => ({ stride: w * clamp(u * 7) }));
  p.sway = -side * lean * 2 * w;
  for (const s of [-1, 1]) p[armKey(s)].ang += s * 0.37 * Math.sin(phase) * w;
  return { lift: Math.abs(Math.sin(phase)) * bounce * energy * p.s, sy: 1 + 0.055 * energy * Math.cos(phase * 2),
    rot: side * lean * w + side * 0.06 * Math.sin(u * Math.PI * 3) * w };
}

export function flight(c, height) {
  const { pose: p, u, energy, arm } = c;
  const airborne = clamp((u - 0.16) / 0.57);
  const arc = 4 * airborne * (1 - airborne);
  const crouch = u < 0.29 ? Math.sin(Math.PI * u / 0.29) : 0;
  const land = Math.sin(Math.PI * clamp((u - 0.71) / 0.29));
  for (const side of [-1, 1]) gesture(p, side, arm * arc, -0.95, 84);
  p.legLen += 0.23 * arc;
  return { sy: 1 + energy * (0.1 * arc - 0.19 * crouch - 0.22 * land), lift: height * p.s * arc * (0.72 + 0.28 * c.mood.bounce) };
}

export function extra(p, n, w, wave = 0, angle = 0.2) {
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, y = -34 + Math.floor(i / 2) * 26;
    const k = clamp(w);
    const ang = angle + Math.sin(wave + i * 1.4) * 0.4 + y / 90;
    p.extra.push({ base: [side * (65 + 15 * k), y], side, ang: side > 0 ? ang : Math.PI - ang,
      len: 1 + k * (62 + i % 3 * 12), w0: 22 * k, w1: 14 * k, curl: side * 0.72, wave: 0.2 });
  }
}

export function held(ctx, p, geo, prop, side = 1, options = {}) {
  const tip = tipOf(geo, armKey(side));
  if (tip) PROPS[prop]?.(ctx, tip.x, tip.y, options.angle ?? 0, p.s * (options.scale ?? 0.75),
    { ...options, line: p.skin?.line });
}

export function worn(ctx, p, prop) {
  const [[x, y]] = toWorld([[0, -78]], p);
  PROPS[prop]?.(ctx, x, y, p.rot, p.s, { line: p.skin?.line });
}

/** Polish (Claude): hide Xiao Ke below a horizontal edge instead of fading him. Hooks for register():
 *  behind() opens a clip above the edge, front() closes it, so bubbles and fx stay unclipped.
 *  The edge is invisible by design and defaults to the floor line just under the feet (nothing is cut at
 *  rest): he sinks through the floor, the slide's bottom, or a card edge given as `edge`.
 *  The contact shadow fades as he sinks. */
export const edgeY = (a, A) => a.edge ?? A.home.y + 130 * A.s;
export function clipBelow(extraFront) {
  return {
    behind(ctx, A, seg, t, p) {
      if (p?.shadow) p.shadow = { ...p.shadow, k: (p.shadow.k ?? 1) * clamp(1 - (p.y - A.home.y) / (70 * A.s)) };
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1e5, -1e5, 2e5, edgeY(seg.args, A) + 1e5);
      ctx.clip();
    },
    front(ctx, A, seg, t, p, geo) {
      ctx.restore();
      extraFront?.(ctx, A, seg, t, p, geo);
    },
  };
}
