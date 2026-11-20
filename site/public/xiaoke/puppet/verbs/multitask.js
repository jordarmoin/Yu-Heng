import { register, gesture, look, face, extra } from './common.js';
import { clamp, ease } from '../math.js';
import { PROPS } from '../props/index.js';
import { tipOf } from '../actor.js';

// 0.18 s look between tasks, staggered process loops, relax and settle.
register('multitask', {
  duration:2.75,
  front(ctx,A,s,t,p,geo){
    const k=ease.inOut((t-.12)/.25)*ease.inOut((s.t1-s.t0-t)/.3);
    const props=['stamp','coffee','keyboard','packet'];
    if(k>0) for(let i=0;i<props.length;i++){
      const tip=tipOf(geo,'extra'+i);
      if(tip) PROPS[props[i]](ctx,tip.x,tip.y,Math.sin(t*5+i)*.12,.45*p.s*k);
    }
  },
  apply(c) {
    const { pose: p, a, w, arm, energy, phase } = c;
    extra(p,clamp(Math.floor(a.arms??6),1,6),arm,phase*3,.12);
    for(const side of [-1,1]) gesture(p,side,arm,-.27+.25*Math.sin(phase*3+side),74);
    face(p,w,null,'cat');
    return {sy:1+.041*energy*Math.sin(phase*3)};
  },
});
