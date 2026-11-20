import { register, xTarget, emit, travel, look, local } from './common.js';
import { clamp, ease, TAU } from '../math.js';

// Polish (Claude): ink-teleport. Puff at the start (he's gone, a cut) · empty beat · puff at the mark ·
// he pops out of it stretched, bounces and settles. xAt jumps while nobody can see him.
register('inkIn', {
  duration: 1.7,
  moveTo: travel,
  xAt: (s, t) => t < (s.t1 - s.t0) * 0.37 ? s.x0 : s.x1,
  fx: (a, s, A) => [
    ...emit('ink', 0.06, { x: s.x0, y: A.home.y + 10 * A.s, s: A.s * 1.05, duration: 0.8 })(a, s, A),
    ...emit('ink', 0.32, { x: s.x1, y: A.home.y + 10 * A.s, s: A.s * 1.05, duration: 0.42 })(a, s, A),
  ],
  apply(c) {
    const { pose: p, u, w, lead, energy, segment } = c;
    const side = Math.sign(segment.x1 - segment.x0) || 1;
    p.alpha = u > 0.1 && u < 0.43 ? 0 : 1;
    const brace = Math.sin(Math.PI * clamp(u / 0.12));
    const out = clamp((u - 0.43) / 0.4);
    p.eyes.blink = Math.max(p.eyes.blink, brace);
    if (u > 0.43) { look(p, local(p, -side * 90, 0), lead); p.eyes.wide += 0.35 * Math.sin(Math.PI * out); }
    return { sy: 1 - 0.2 * energy * brace + 0.24 * energy * Math.sin(out * TAU) * (1 - out),
      lift: 46 * p.s * w * Math.max(0, Math.sin(out * Math.PI)) * (1 - out * 0.4) };
  },
}, xTarget);
