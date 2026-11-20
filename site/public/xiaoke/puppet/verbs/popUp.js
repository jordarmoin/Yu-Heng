import { register, direction, local, look, clipBelow, edgeY } from './common.js';
import { clamp, ease } from '../math.js';

// Polish (Claude): pops up from behind an invisible edge instead of fading in.
// 0–0.12 quick dip out of sight · hidden beat · 0.3–0.62 spring up with stretch · overshoot · squash and settle.
register('popUp', {
  duration: 1.27,
  ...clipBelow(),
  moveTo: (a, actor) => a.from === 'left' || a.from === 'right' ? a.x ?? actor._x - direction(a.from) * actor.s * 100 : null,
  apply(c) {
    const { pose: p, a, u, lead, energy, actor } = c;
    const side = direction(a.from);
    const edge = edgeY(a, actor);
    const hidden = ease.inOut(clamp(u / 0.12)) * (1 - ease.outBack(clamp((u - 0.3) / 0.32), 2.2));
    const depth = (edge - p.y + 70 * p.s) * hidden;     // the crown stays visible (never a blank frame)
    const rising = Math.sin(Math.PI * clamp((u - 0.3) / 0.3));
    const land = Math.sin(Math.PI * clamp((u - 0.6) / 0.2));
    look(p, local(p, side * 60, -60), lead);
    p.eyes.wide += 0.35 * rising;
    p.mouth.mode = rising > 0.3 ? 'open' : p.mouth.mode;
    return { lift: -depth, sy: 1 + 0.16 * energy * rising - 0.12 * energy * land };
  },
});
