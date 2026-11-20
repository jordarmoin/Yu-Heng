import { register, face } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('sleep', {
  duration:3,
  fx:(a,s,A)=>{ const events=[]; for(let t=.28;t<s.t1-s.t0;t+=1.2) events.push({kind:'zzz',follow:true,t:s.t0+t}); return events; },
  apply(c) {
    const { pose: p, w, energy, phase } = c;
    face(p,w,'content','o');
    p.splay += .28*w;
    return {sy:1-.15*energy+.03*w*Math.sin(phase*2),rot:-.13*w};
  },
});
