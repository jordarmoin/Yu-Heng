import { register, direction, gesture, gait } from './common.js';
import { clamp } from '../math.js';

// 0.18 s glance, walk onto the stage, short arrival wave and settle.
register('slideIn', {
  duration: (a, actor, tempo) => (1.04 + Math.abs((a.x ?? actor._x - direction(a.side) * 200 * actor.s) - actor._x) / (340 * actor.s)) / tempo,
  moveTo: (a, actor) => a.x ?? actor._x - direction(a.side) * 200 * actor.s,
  apply(c) {
    const { pose: p, a, u, phase } = c;
    const walk = gait(c, { stride: 67, turn: 0.36, bounce: 7, lean: 0.065 });
    const wave = Math.sin(Math.PI * clamp((u - 0.53) / 0.47));
    const side = -direction(a.side);
    gesture(p, side, wave, -0.55 + 0.18 * Math.sin(phase * 4));
    return walk;
  },
}, side => ({ side }));
