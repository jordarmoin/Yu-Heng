import { register, direction, gesture, local, reach } from './common.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('scroll', {
  apply(c) {
    const { pose: p, a, w, arm, energy, phase } = c;
    const side=direction(a.side),dir=a.dir==='up'||a.dir===-1?-1:1;
    const stroke=Math.sin(phase*2);
    reach(c,local(p,side*(136+13*Math.cos(phase*2)),dir*66*stroke),arm,.58,false,side);
    gesture(p,-side,arm*.65,-.1+.48*stroke,60);
    return {sy:1+.047*energy*stroke,rot:side*.055*w};
  },
});
