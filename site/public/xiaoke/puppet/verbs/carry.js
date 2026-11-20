import { register, gesture, travel, gait } from './common.js';
import { PROPS } from '../props/index.js';
import { tipOf } from '../actor.js';

// 0.18 s eyes and weight shift, paced gait, braking lean and 0.34 s settle.
register('carry', {
  moveTo: travel,
  duration: (a, A, tempo) => 0.73 + Math.abs(travel(a,A) - A._x) / (A.s * tempo * 116),
  // Polish (Claude): the box rides overhead between both arm tips (it used to hang off one arm).
  front(ctx,A,s,t,p,geo) {
    if (t <= 0.2 || t >= s.t1-s.t0-0.22) return;
    const l = tipOf(geo,'armL'), r = tipOf(geo,'armR');
    if (l && r) PROPS[s.args.prop ?? 'cardboard']?.(ctx,(l.x+r.x)/2,Math.min(l.y,r.y)-4*p.s,p.rot,p.s*0.95,{line:p.skin?.line});
  },
  apply(c) {
    const { pose: p, arm, energy } = c;
    const walk = gait(c, { stride: 54, turn: 0.25, bounce: 3, lean: 0.065 });
    for (const side of [-1,1]) gesture(p,side,arm,-1.3,112,-side*0.55,false);
    walk.sy -= 0.07 * energy;
    return walk;
  },
}, prop => ({ prop }));
