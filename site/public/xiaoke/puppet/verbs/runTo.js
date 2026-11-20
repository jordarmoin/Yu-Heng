import { register, xTarget, emit, ground, travel, gait } from './common.js';
import { lerp } from '../math.js';

// 0.18 s eyes and weight shift, paced gait, braking lean and 0.34 s settle.
register('runTo', {
  moveTo: travel,
  duration: (a, A, tempo) => 0.73 + Math.abs(travel(a,A) - A._x) / (A.s * tempo * 510),
  fx: (a,s,A) => [...emit('speedLines',0.32,{x:lerp(s.x0,s.x1,0.38),y:A.home.y,dir:Math.sign(s.x1-s.x0)})(a,s,A), ...emit('dust',0.74,ground)(a,s,A)],
  apply(c) {
    const {  } = c;
    const walk = gait(c, { stride: 88, turn: 0.68, bounce: 17, lean: 0.18 });
    return walk;
  },
}, xTarget);
