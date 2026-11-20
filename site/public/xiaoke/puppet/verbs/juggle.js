import { register, gesture, local, look, extra } from './common.js';
import { clamp, ease, TAU } from '../math.js';
import { PROPS } from '../props/index.js';

// 0.18 s eye cue, toss staggered boxes, catch and settle.
register('juggle', {
  duration:2.9,
  front(ctx,A,s,t,p){
    const D=s.t1-s.t0,k=ease.inOut((t-.12)/.22)*ease.inOut((D-t)/.34);
    const n=clamp(Math.floor(s.args.n??3),1,5);
    if(k>0) for(let i=0;i<n;i++){
      const theta=t/D*TAU*2+i*TAU/n;
      PROPS.server(ctx,p.x+130*p.s*Math.sin(theta),p.y-p.s*(56+136*Math.max(0,Math.cos(theta))),theta*.25,.51*p.s*k,{variant:['front','brain','box'][i%3]});
    }
  },
  apply(c) {
    const { pose: p, w, lead, arm, energy, phase } = c;
    extra(p,4,arm,phase*4,-.54);
    look(p,local(p,55*Math.sin(phase*2),-120),lead);
    for(const side of [-1,1]) gesture(p,side,arm,-.25+.35*Math.sin(phase*4+side),86);
    return {sy:1+.05*energy*Math.sin(phase*4),rot:.06*w*Math.sin(phase*2)};
  },
}, n=>({n}));
