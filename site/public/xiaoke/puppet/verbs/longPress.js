import { register, local, reach, face, emit, atTarget } from './common.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('longPress', {
  duration:(a,A,tempo)=>.62+(a.dur ?? 1.15)/tempo,
  fx:(a,s,A)=>emit('fillRing',.23,{...atTarget(a,s,A),duration:(s.t1-s.t0)*.58})(a,s,A),
  apply(c) {
    const { pose: p, a, w, arm, energy } = c;
    const tg=a.target ?? local(p,154,12);
    const side=reach(c,tg,arm,0,false,undefined,true);
    p.eyes.lidLow+=.31*w;
    face(p,w,null,'flat');
    return {sy:1-.075*energy,rot:side*.11*energy};
  },
}, (target,dur)=>({target,dur}));
