import { register, gesture, face, emit, atHead } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('cheer', {
  duration:2.4,
  fx:emit('sparkle',.31,atHead),
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    for(const side of [-1,1]) gesture(p,side,arm,-.75+.22*Math.sin(phase*4+side),92);
    face(p,w,'happy','open');
    return {lift:26*energy*p.s*Math.abs(Math.sin(phase*2)),sy:1+.10*energy*Math.sin(phase*4)};
  },
});
