import { register, look, reach, emit } from './common.js';
import { clamp, lerp } from '../math.js';

// 0.18 s look at the shape, draw with a sucker, trace holds before settle.
register('underline', {
  duration: 1.85,
  fx: (a,s,A) => emit('trail',0.2,{ x:0,y:0,points:trace(a,s.x0,A.home.y,A.s),reveal:(s.t1-s.t0)*.45,duration:(s.t1-s.t0)*.45+1 })(a,s,A),
  apply(c) {
    const { pose: p, a, u, arm, energy, phase, segment, actor } = c;
    const points = trace(a,segment.x0,actor.home.y,p.s);
    const index=Math.min(48,Math.floor(clamp((u-.2)/.45)*48));
    reach(c,points[index],arm,0.43,false,Math.sign(points[0][0]-p.x) || 1,true);
    return {rot:0.045*energy*Math.sin(phase)};
  },
}, (a,b) => ({a,b}));

function trace(a,x,y,scale) {
  const start=a.a ?? [x+109*scale,y+40*scale], end=a.b ?? [x+185*scale,y+43*scale];
  return Array.from({length:49},(_,i)=>[lerp(start[0],end[0],i/48),lerp(start[1],end[1],i/48)]);
}
