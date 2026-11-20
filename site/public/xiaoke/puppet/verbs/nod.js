import { register, gesture, local, look } from './common.js';

// 0.18 s eye cue, conversational gesture, 0.3 s settle.
register('nod', {
  apply(c) {
    const { pose: p, a, lead, energy, phase } = c;
    look(p,local(p,0,55*Math.sin(phase*(a.n??2))),lead);
    return {sy:1+.07*energy*Math.sin(phase*(a.n??2)),rot:.077*energy*Math.sin(phase*(a.n??2))};
  },
});
