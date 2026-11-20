import { register, direction, gesture, local, look, emit, atHead } from './common.js';

// 0.18 s look aside, sweeping open palms, bow and settle.
register('present', {
  duration: 1.65,
  fx: emit('sparkle',0.34,atHead),
  apply(c) {
    const { pose: p, a, u, w, lead, arm, energy, phase } = c;
    const side = direction(a.side);
    look(p, local(p, side*137,-35), lead);
    for(const hand of [-1,1]) gesture(p,hand,arm,-0.25+0.23*Math.sin(phase),hand===side?104:81);
    return { sy:1-0.12*energy*Math.sin(Math.PI*u),rot:side*0.15*w*Math.sin(Math.PI*u) };
  },
});
