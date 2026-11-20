import { register, gesture } from './common.js';

// 0.2 s lift, alternating swim strokes, bob and settle.
register('float', {
  duration: 2.6,
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    p.splay += 0.52 * w;
    p.legLen += 0.34 * w;
    p.sway = 0.5 * w * Math.sin(phase * 2);
    for (const side of [-1,1]) gesture(p, side, arm, -0.32 + 0.56 * Math.sin(phase*2+side), 67);
    return { lift: (85 + 19 * Math.cos(phase * 2)) * p.s * energy, rot: 0.11 * Math.sin(phase * 2) * w };
  },
});
