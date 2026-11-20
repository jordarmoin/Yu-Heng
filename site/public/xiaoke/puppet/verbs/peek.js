import { register, direction, local, look, clipBelow, edgeY } from './common.js';
import { clamp, ease } from '../math.js';

// Polish (Claude): peek over an invisible edge (no drawn panel, no see-through body).
// 0–0.2 sink until only the eyes clear the edge · scan away, scan back, blink · 0.8–1 rise and settle.
register('peek', {
  ...clipBelow(),
  apply(c) {
    const { pose: p, a, u, lead, energy, phase, actor } = c;
    const side = direction(a.side);
    const edge = edgeY(a, actor);
    const sink = ease.inOut(clamp(u / 0.2)) * (1 - ease.outBack(clamp((u - 0.8) / 0.18)));
    const depth = (edge - p.y + 34 * p.s) * sink;       // eye tops (−36) sit just above the edge
    const scan = Math.sin(clamp((u - 0.22) / 0.56) * Math.PI * 2);
    look(p, local(p, side * (40 + 130 * scan), -30), lead);
    p.turn = side * 0.18 * sink * scan;
    p.eyes.blink = Math.max(p.eyes.blink, clamp(1 - Math.abs(u - 0.5) / 0.035) * sink);
    p.brow.show = Math.max(p.brow.show, 0.8 * sink); p.brow.raise += 0.5 * sink;
    return { lift: -depth, sy: 1 - 0.06 * energy * sink };
  },
});
