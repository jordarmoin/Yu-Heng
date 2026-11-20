import { register, local, look, face, emit, atHead } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('wakeUp', {
  fx:emit('exclaim',.21,atHead),
  apply(c) {
    const { pose: p, u, w, lead, energy, phase } = c;
    face(p,w,u<.45?'dot':'open',u<.45?'o':'smile');
    p.eyes.blink=Math.max(p.eyes.blink,Math.max(0,Math.sin(phase*3))**14*w);
    look(p,local(p,100,-40),lead);
    return {sy:1+.17*energy*Math.sin(phase),lift:36*p.s*energy*Math.max(0,Math.sin(phase))};
  },
});
