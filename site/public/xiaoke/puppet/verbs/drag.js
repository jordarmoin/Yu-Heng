import { register, local, reach, emit } from './common.js';
import { ease, lerp } from '../math.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('drag', {
  duration:1.66,
  fx:(a,s,A)=>emit('ripple',.71,{x:a.to?.[0]??s.x0+194*A.s,y:a.to?.[1]??A.home.y+35*A.s})(a,s,A),
  apply(c) {
    const { pose: p, a, u, arm, energy, phase } = c;
    const from=a.from ?? local(p,143,-43),to=a.to ?? local(p,194,35);
    const progress=ease.inOut((u-.28)/.41);
    const target=[lerp(from[0],to[0],progress),lerp(from[1],to[1],progress)];
    reach(c, target, arm, 0.38, false, Math.sign(from[0] - p.x) || 1, true);
    return {sy:1-.12*energy*Math.sin(Math.PI*progress),rot:.11*energy*Math.sin(phase)};
  },
}, (from,to)=>({from,to}));
