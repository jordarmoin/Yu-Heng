import { register, local, reach } from './common.js';

// 0.18 s glance at the bubble, swat, overshoot and settle.
register('batAway', {
  duration:1.05,
  apply(c) {
    const { pose: p, a, arm, energy, phase } = c;
    const target=a.target ?? local(p,122,-83);
    reach(c,target,arm,.53,true);
    return {rot:.12*energy*Math.sin(phase)};
  },
});
