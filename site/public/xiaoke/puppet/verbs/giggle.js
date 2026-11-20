import { register, local, reach, face, emit, atHead } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('giggle', {
  fx:emit('notes',.38,atHead),
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    face(p,w,'squeeze','smile');
    reach(c,local(p,9,23),arm,.67,true,1);
    return {sy:1+.046*energy*Math.sin(phase*6),rot:.075*w*Math.sin(phase*5)};
  },
});
