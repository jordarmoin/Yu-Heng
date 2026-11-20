import { register, targetArg, local, reach } from './common.js';

// 0.18 s target cue, contact or hesitation, reaction and 0.3 s settle.
register('hover', {
  apply(c) {
    const { pose: p, a, w, arm, energy, phase } = c;
    const tg=a.target ?? local(p,152,-34);
    const side=Math.sign(tg[0]-p.x)||1;
    reach(c,[tg[0]-side*9*p.s,tg[1]+6*Math.sin(phase*3)*p.s],arm*.87,.58,false,side);
    p.brow.raise += .48*w;
    return {rot:side*.045*energy};
  },
}, targetArg);
