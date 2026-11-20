import { register, gesture, local, look, reach, emit, atHead } from './common.js';

// 0.18 s eye cue, conversational gesture, 0.3 s settle.
register('think', {
  fx: emit('bulb',0.63,atHead),
  duration: 2.55,
  apply(c) {
    const { pose: p, lead, arm, energy, phase } = c;
    look(p,local(p,75,-130),lead);
    reach(c,local(p,22,39),arm*(.8+.2*Math.sin(phase*3)),.67,true,1);
    return {rot:-.11*energy};
  },
});
