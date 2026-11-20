import { register, gesture, local, look, extra } from './common.js';
import { clamp, ease } from '../math.js';

// 0.18 s first look, raise successive arms, proud beat then settle.
register('count', {
  duration: (a,A,tempo) => (1.1+0.24*(a.n ?? 4))/tempo,
  apply(c) {
    const { pose: p, a, u, lead, arm, energy } = c;
    const n = clamp(Math.floor(a.n ?? 4),1,8);
    const count = clamp((u-0.14)/0.63)*n;
    const side = Math.floor(count)%2 ? -1 : 1;
    look(p,local(p,side*110,-45),lead);
    gesture(p,1,arm*clamp(count),-.72);
    gesture(p,-1,arm*clamp(count-1),-.72);
    for (let i=0;i<n-2;i++) {
      const k=arm*ease.outBack(count-i-2);
      if(!k) continue;
      const hand=i%2?-1:1;
      p.extra.push({base:[hand*72,-25+Math.floor(i/2)*26],ang:hand===1?-.59:Math.PI+.59,len:75*k,w0:24*k,w1:15*k,curl:hand*.8});
    }
    return {sy:1+.045*energy*Math.sin(count*Math.PI)};
  },
}, n => ({ n }));
