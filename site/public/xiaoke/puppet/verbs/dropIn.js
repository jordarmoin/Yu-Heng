import { register, xTarget, local, look, emit, atHead, ground, travel } from './common.js';
import { clamp, ease } from '../math.js';

// 0.18 s look down, stretch through fall, squash and dizzy settle.
register('dropIn', {
  duration: 1.6,
  moveTo: travel,
  fx: (a,s,A) => [...emit('dust',0.68,ground)(a,s,A), ...emit('dizzy',0.7,atHead)(a,s,A)],
  apply(c) {
    const { pose: p, u, lead, energy, phase, actor } = c;
    const rise = ease.inOut(u / 0.27) * (1 - ease.in((u - 0.27) / 0.41));
    const impact = Math.sin(Math.PI * clamp((u - 0.68) / 0.24));
    look(p, local(p, 0, 80), lead);
    p.legLen += 0.22 * rise;
    return { lift: rise * (actor.home.y + 85 * p.s), sy: 1 + 0.18 * rise - 0.17 * impact * energy, rot: 0.13 * Math.sin(phase * 2) * impact };
  },
}, xTarget);
