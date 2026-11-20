import { register, targetArg, local, reach } from './common.js';

// 0.18 s target cue, spring and grip, hang and swing before release.
register('cling', {
  duration:1.95,
  apply(c) {
    const { pose: p, a, w, arm, energy, phase } = c;
    const target=a.target ?? local(p,110,-126);
    const side=reach(c,target,arm,.72,false,undefined,true);
    p.splay+=.5*w;
    return {lift:Math.max(0,p.y-target[1]-35*p.s)*w,rot:side*.19*energy*Math.sin(phase*1.5)};
  },
}, targetArg);
