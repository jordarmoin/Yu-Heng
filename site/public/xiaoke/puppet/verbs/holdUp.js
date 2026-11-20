import { register, gesture, local, look } from './common.js';
import { ease } from '../math.js';
import { PROPS } from '../props/index.js';
import { tipOf } from '../actor.js';

// 0.18 s eyes up, hoist with two arms, slight strain and settle.
register('holdUp', {
  duration: 1.85,
  front(ctx,A,s,t,p,geo) {
    const k=ease.inOut((t-.15)/.22)*ease.inOut((s.t1-s.t0-t-.42)/.12);  // polish: sign leaves before the arms come down
    if(k>0) {
      const l=tipOf(geo,'armL'), r=tipOf(geo,'armR');
      if(l&&r) PROPS[s.args.prop ?? 'sign']?.(ctx,(l.x+r.x)/2,(l.y+r.y)/2-20*p.s,p.rot,p.s*k,{line:p.skin.line});
    }
  },
  apply(c) {
    const { pose: p, w, lead, arm, energy, phase } = c;
    look(p,local(p,0,-185),lead);
    for (const side of [-1,1]) gesture(p,side,arm,-1.32,117,-side*.5,false);
    p.eyes.lidLow += 0.34*w;
    return { sy:1+0.09*energy+0.025*w*Math.sin(phase*4) };
  },
});
