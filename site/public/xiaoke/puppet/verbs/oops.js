import { register, local, look, face, emit, atHead } from './common.js';
import { clamp, mixHex } from '../math.js';
import { MOOD_SKIN, skinToward } from '../palette.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('oops', {
  fx:(a,s,A)=>[...emit('ink',.19,{x:s.x0+92*A.s,y:A.home.y+66*A.s,s:0.42*A.s,duration:0.8})(a,s,A),...emit('sweat',.45,atHead)(a,s,A)],
  apply(c) {
    const { pose: p, u, w, lead, energy, phase } = c;
    const flush = skinToward(MOOD_SKIN.shy, 0.72);
    p.skin = Object.fromEntries(Object.entries(p.skin).map(([key, color]) => [key, mixHex(color, flush[key], clamp(w))]));
    face(p,w,u<.43?'dot':'open',u<.43?'o':'cat');
    look(p,local(p,-74,45),lead);
    return {sy:1+.16*energy*Math.sin(phase),rot:-.13*w};
  },
});
