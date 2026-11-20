import { register, gesture, local, look } from './common.js';

// 0.18 s eye cue, conversational gesture, 0.3 s settle.
register('shake', {
  apply(c) {
    const { pose: p, a, w, lead, energy, phase } = c;
    p.turn=.42*w*Math.sin(phase*(a.n??2));
    look(p,local(p,-p.turn*150,0),lead);
    return {rot:.14*energy*Math.sin(phase*(a.n??2))};
  },
});
