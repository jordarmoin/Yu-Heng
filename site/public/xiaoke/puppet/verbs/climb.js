import { register, reach } from './common.js';
import { ease } from '../math.js';

// 0.18 s eyes up, alternate suction grips, hang briefly and settle.
register('climb', {
  duration: 2.2,
  apply(c) {
    const { pose: p, a, u, w, arm, phase } = c;
    const side = Math.sign((a.edge ?? p.x+100*p.s)-p.x) || 1;
    p.turn += side * 0.32 * w;   // polish: less turn keeps the face clear of the grips
    const y = (a.toY ?? p.y - 160*p.s);
    const lift = (p.y-y) * w * ease.inOut(u/0.58);
    for (const hand of [-1,1]) {
      const goal=[a.edge ?? p.x + side*120*p.s,p.y-lift + (-92+34*Math.sin(phase*2+hand*Math.PI/2))*p.s]  // grips above the head;
      reach(c,goal,arm,0.7,false,hand,true);
    }
    p.splay -= .36*w;
    return { lift, rot:side*0.09*w };
  },
});
