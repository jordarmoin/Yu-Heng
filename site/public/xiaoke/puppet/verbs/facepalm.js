import { register, local, reach } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('facepalm', {
  duration:1.8,
  apply(c) {
    const { pose: p, w, arm, energy, phase } = c;
    reach(c,local(p,-34,-21),arm,.59,true,1);
    p.eyes.lid+=.46*w;
    return {sy:1-.09*energy,rot:.12*w*Math.sin(phase*2)};
  },
});
