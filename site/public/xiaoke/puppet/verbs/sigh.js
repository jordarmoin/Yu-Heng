import { register, face } from './common.js';
import { ease } from '../math.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('sigh', {
  duration:1.65,
  apply(c) {
    const { pose: p, u, w, energy, phase } = c;
    p.eyes.lid += .44*w;
    p.splay -= .18*w;
    face(p,w,null,'o');
    return {sy:1+.23*energy*Math.sin(phase),rot:-.12*energy*ease.inOut(u/.8)};
  },
});
