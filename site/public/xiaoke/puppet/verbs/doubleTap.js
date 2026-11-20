import { register, targetArg, local, reach, emit, atTarget } from './common.js';
import { TAU } from '../math.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('doubleTap', {
  fx:(a,s,A)=>[...emit('ripple',.32,atTarget)(a,s,A),...emit('ripple',.63,atTarget)(a,s,A)],
  apply(c) {
    const { pose: p, a, u, arm, energy } = c;
    const tg=a.target ?? local(p,154,12);
    const k=Math.max(0,Math.cos((u-.32)*TAU/.31))**5;
    const side=reach(c,[tg[0],tg[1]-22*(1-k)*p.s],arm,0,false,undefined,true);
    return {sy:1-.06*k*energy,rot:.08*side*arm};
  },
}, targetArg);
