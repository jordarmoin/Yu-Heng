import { register, gesture } from './common.js';

// 0.18 s eye cue, conversational gesture, 0.3 s settle.
register('explain', {
  duration: 2.55,
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    for(const side of [-1,1]) gesture(p,side,arm,-.22+.4*Math.sin(phase*3+side),68,side*.72);
    return {sy:1+.04*energy*Math.sin(phase*3),rot:.055*w*Math.sin(phase*1.5)};
  },
});
