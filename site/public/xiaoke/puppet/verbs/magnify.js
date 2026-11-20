import { register, targetArg, local, look, reach, held } from './common.js';
import { ease } from '../math.js';

// 0.18 s look, raise lens, squint and lean, then settle.
register('magnify', {
  duration: 1.72,
  front(ctx,A,s,t,p,geo) {
    const side=Math.sign((s.args.target?.[0] ?? p.x+1)-p.x)||1;
    const k=ease.inOut((t-.12)/.23)*ease.inOut((s.t1-s.t0-t)/.3);
    if(k>0) held(ctx,p,geo,'magnifier',side,{scale:k});
  },
  apply(c) {
    const { pose: p, a, w, arm, energy } = c;
    const target=a.target ?? local(p,132,-27);
    const side=reach(c,target,arm,0.58,false,undefined,true);
    p.eyes.lid += 0.52*w;
    p.brow.show = Math.max(p.brow.show,.8*w);
    return {rot:side*.13*energy,sy:1-.05*energy};
  },
}, targetArg);
