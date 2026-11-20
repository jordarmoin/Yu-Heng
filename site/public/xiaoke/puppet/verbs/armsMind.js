import { register, local, look, reach, face, emit, atHead, held } from './common.js';
import { ease } from '../math.js';

// 0.18 s reaction cue, emotional peak, overshoot and 0.3 s settle.
register('armsMind', {
  duration:2.35,
  fx:emit('anger',.54,atHead),
  front(ctx,A,s,t,p,geo){const k=ease.inOut((t-.43)/.22)*ease.inOut((s.t1-s.t0-t)/.35);if(k>0) held(ctx,p,geo,'coffee',1,{scale:.68*k});},
  apply(c) {
    const { pose: p, u, w, lead, arm, energy, phase } = c;
    const target=local(p,147+33*Math.sin(phase),45-53*Math.sin(Math.PI*u));
    reach(c,target,arm,.94,false,1);
    look(p,u<.31?local(p,-100,-34):target,lead);
    face(p,w,u<.55?'dot':'open',u<.55?'o':'frown');
    p.brow.tilt+=.8*w*ease.inOut((u-.46)/.15);
    return {rot:.18*energy*Math.sin(phase)};
  },
});
