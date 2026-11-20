import { register, xTarget, local, look, emit, travel } from './common.js';
import { ease, lerp } from '../math.js';

// 0.19 s anticipation, jet and trail, brake past the mark and settle.
register('jetIn', {
  duration: 1.55,
  moveTo: travel,
  xAt: (s,t) => lerp(s.x0,s.x1,ease.outBack((t/(s.t1-s.t0)-0.12)/0.83)),
  fx: (a,s,A) => [0.23,0.35,0.47,0.59].flatMap(f => emit('inkTrail',f,{x:lerp(s.x0,s.x1,ease.outBack((f-0.12)/0.83))-Math.sign(s.x1-s.x0)*150*A.s,y:A.home.y+6*A.s,dir:Math.sign(s.x1-s.x0),s:A.s})(a,s,A)),
  apply(c) {
    const { pose: p, w, lead, energy, phase, segment } = c;
    const side = Math.sign(segment.x1 - segment.x0) || 1;
    look(p, local(p, side * 130, 10), lead);
    p.turn = side * w * 0.72;
    p.legs = Array.from({ length: 4 }, (_, i) => {
      const footSide = i < 2 ? -1 : 1, inner = i === 1 || i === 2;
      const rest = Math.PI / 2 - footSide * ((inner ? 0.07 : 0.2) + p.splay * (inner ? 0.5 : 1));
      return { ang: lerp(rest, Math.PI / 2 + side * (1.17 + i * 0.07), w), len: 1 + 0.45 * w,
        curl: lerp(-footSide * (inner ? 0.22 : 0.42), side * 0.5, w) };
    });
    return { sy: 1 - 0.28 * energy, lift: 52 * p.s * w, rot: side * 0.35 * Math.sin(phase) * energy };
  },
}, xTarget);
