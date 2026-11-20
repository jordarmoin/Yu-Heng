import { register, face, emit, atHead, ground, flight } from './common.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('celebrate', {
  duration:1.45,
  fx:(a,s,A)=>[...emit('confetti',.29,atHead)(a,s,A),...emit('dust',.73,ground)(a,s,A)],
  apply(c) {
    const { pose: p, w } = c;
    face(p,w,'happy','open');
    return flight(c,140);
  },
});
