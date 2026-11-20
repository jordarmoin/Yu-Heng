import { register, gesture, face } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('stretch', {
  duration:1.7,
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    for(const side of [-1,1]) gesture(p,side,arm,-1.25,107,side*.52);
    face(p,w,'squeeze',null);
    return {sy:1+.21*energy,rot:.10*energy*Math.sin(phase)};
  },
});
