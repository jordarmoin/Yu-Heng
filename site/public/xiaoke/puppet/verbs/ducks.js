import { register, local, look, clipBelow, edgeY } from './common.js';
import { clamp, ease } from '../math.js';

// Polish (Claude): a real duck behind an edge, no fading.
// 0–0.16 eyes flick down · 0.16–0.34 drop (squash on the way) · hold hidden · 0.55–0.68 eyes peek over
// the edge, one look each way · 0.78–1 rise back up with a small overshoot and settle.
register('ducks', {
  duration: 1.5,
  ...clipBelow(),
  apply(c) {
    const { pose: p, a, u, w, lead, energy, actor } = c;
    const edge = edgeY(a, actor);
    const hide = edge - p.y + 70 * p.s;                 // only the crown of the head stays above the edge
    const peekDepth = edge - p.y + 30 * p.s;            // eye tops just over the edge
    const down = ease.in(clamp((u - 0.12) / 0.2));
    const peekUp = ease.outBack(clamp((u - 0.5) / 0.12)) * (1 - ease.inOut(clamp((u - 0.7) / 0.08)));
    const up = ease.outBack(clamp((u - 0.8) / 0.17));
    const depth = Math.max(0, hide * down * (1 - up) - (hide - peekDepth) * peekUp * (1 - up));
    look(p, local(p, 0, 90), lead * (1 - clamp((u - 0.45) * 8)));
    if (u > 0.55 && u < 0.72) look(p, local(p, Math.sin((u - 0.55) / 0.17 * Math.PI * 2) * 160, -20), 1);
    p.eyes.wide += 0.3 * clamp(1 - Math.abs(u - 0.6) / 0.08);
    p.mouth.mode = u > 0.1 && u < 0.85 ? 'o' : p.mouth.mode;
    const anticip = Math.sin(Math.PI * clamp(u / 0.14));
    return { sy: 1 - 0.18 * energy * anticip + 0.12 * energy * Math.sin(Math.PI * clamp((u - 0.12) / 0.2)),
      lift: -depth };
  },
});
