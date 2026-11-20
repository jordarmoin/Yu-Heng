import { register, direction, gesture, local, look } from './common.js';
import { clamp, ease } from '../math.js';

// 0.18 s eye cue, stretch through gap, pop back and settle.
register('squeeze', {
  moveTo:(a,A)=>a.x ?? (a.gapX ?? A._x+75*A.s)+direction(a.side)*( (a.gapW ?? 103)/2+45*A.s ),
  apply(c) {
    const { pose: p, a, u, w, lead, arm, phase, segment } = c;
    const dir=Math.sign(segment.x1-segment.x0)||1;
    look(p,local(p,dir*145,0),lead);
    p.turn=dir*.43*w;
    p.splay-=.54*w;
    for(const side of [-1,1]) gesture(p,side,arm,1.29,46,side*.72);
    const thin=ease.inOut((u-.14)/.23)*ease.inOut((.85-u)/.27);
    return {sy:1+clamp(142/(a.gapW??103),.25,1.5)*.47*thin,rot:.11*dir*Math.sin(phase)*w};
  },
}, (gapX,gapW)=>({gapX,gapW}));
