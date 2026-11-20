import { register, gesture } from './common.js';

// 0.18 s eye cue, conversational gesture, 0.3 s settle.
register('shrug', {
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    for(const side of [-1,1]) gesture(p,side,arm,-.44,64,side*.9);
    p.brow.show=Math.max(p.brow.show,.8*w); p.brow.raise+=.7*w;
    return {sy:1+.075*energy,rot:.07*w*Math.sin(phase)};
  },
});
