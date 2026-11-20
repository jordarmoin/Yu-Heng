import { register, direction, gesture, local, look, face } from './common.js';
import { ease } from '../math.js';

// 0.18 s grip, let go into slide, splay and settle.
register('slideDown', {
  duration: 1.55,
  apply(c) {
    const { pose: p, a, u, w, lead, arm, energy, phase } = c;
    const side = direction(a.side);
    look(p, local(p, side*85,95), lead);
    p.turn = side*0.6*w;
    p.splay += 0.65*w;
    gesture(p,side,arm,-0.73,88);
    face(p,w,'happy','open');
    return { lift: ((p.y - (a.toY ?? p.y+90*p.s)) * ease.in(u) + 135*p.s*(1-ease.in(u))) * w, sy:1+0.12*energy*Math.sin(phase) };
  },
});
