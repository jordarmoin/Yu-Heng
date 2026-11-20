import { register, direction, gesture, local, look } from './common.js';

// 0.18 s eye cue, conversational gesture, 0.3 s settle.
register('listen', {
  apply(c) {
    const { pose: p, a, w, lead, energy, phase } = c;
    const side=direction(a.side);
    look(p,local(p,side*100,-22),lead);
    p.brow.show=Math.max(p.brow.show,.8*w); p.brow.raise+=.45*w;
    return {rot:side*.14*energy,sy:1+.03*w*Math.sin(phase*2)};
  },
});
