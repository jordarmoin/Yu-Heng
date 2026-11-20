import { register, gesture, local, look, extra } from './common.js';
import { clamp, ease } from '../math.js';
import { PROPS } from '../props/index.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('type', {
  duration:2.6,
  front(ctx,A,s,t,p){
    const k=ease.inOut((t-.12)/.24)*ease.inOut((s.t1-s.t0-t)/.3);
    if(k>0) PROPS.keyboard(ctx,p.x,p.y+106*p.s,p.rot,1.12*p.s*k);
  },
  apply(c) {
    const { pose: p, a, w, lead, arm, energy, phase } = c;
    look(p,local(p,0,110),lead);
    extra(p,clamp(Math.floor(a.arms??6),4,6),arm,phase*6,1.05);
    for(const side of [-1,1]) gesture(p,side,arm,1.6+.22*Math.sin(phase*7+side),73,side*.59,true);
    p.eyes.lid+=.28*w; p.brow.show=Math.max(p.brow.show,.72*w);
    return {sy:1+.022*energy*Math.sin(phase*4)};
  },
});
