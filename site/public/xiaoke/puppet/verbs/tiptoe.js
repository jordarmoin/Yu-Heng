import { register, xTarget, travel, gait } from './common.js';

// 0.18 s eyes and weight shift, paced gait, braking lean and 0.34 s settle.
register('tiptoe', {
  moveTo: travel,
  duration: (a, A, tempo) => 0.73 + Math.abs(travel(a,A) - A._x) / (A.s * tempo * 100),
  apply(c) {
    const { pose: p, w } = c;
    const walk = gait(c, { stride: 50, turn: 0.32, bounce: 9, lean: 0.115 });
    p.eyes.lid += 0.38 * w;
    p.legLen += 0.21 * w;
    return walk;
  },
}, xTarget);
