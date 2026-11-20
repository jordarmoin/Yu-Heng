import { register, targetArg, local, reach } from './common.js';
import { ease, lerp } from '../math.js';
import { PROPS } from '../props/index.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('pull', {
  duration:1.66,
  front(ctx,A,s,t,p){
    const k=ease.inOut(t/.21)*ease.inOut((s.t1-s.t0-t)/.3);
    const target=s.args.target ?? local(p,156,42);
    const side=Math.sign(target[0]-p.x)||1;
    if(k>0) PROPS.lever(ctx,...target,0,p.s*k,{pull:lerp(-side*.45,side*.87,ease.inOut((t/(s.t1-s.t0)-.46)/.24))});
  },
  apply(c) {
    const { pose: p, a, u, w, arm, energy } = c;
    const origin=a.target ?? local(p,156,42);
    const side=Math.sign(origin[0]-p.x)||1;
    const give=ease.inOut((u-.46)/.24);
    const angle=lerp(-side*.45,side*.87,give);
    const target=[origin[0]+Math.sin(angle)*42*p.s,origin[1]+(19-Math.cos(angle)*42)*p.s];
    reach(c,target,arm,.43,false,side,true);
    p.eyes.lidLow += .42*w;
    return {rot:-side*.17*energy+side*.13*give*w,sy:1-.12*energy*Math.sin(Math.PI*u)};
  },
}, targetArg);
