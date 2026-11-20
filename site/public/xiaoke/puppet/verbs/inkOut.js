import { register, emit, look, local } from './common.js';
import { clamp, ease } from '../math.js';

// Polish (Claude): brace · ink burst hides him (a cut, never a fade) · empty beat · second puff, he pops back.
// 0–0.2 brace and squeeze small, eyes shut · 0.21 burst · 0.26–0.68 gone · 0.68 pops back (dust), blinks, settles.
register('inkOut', {
  duration: 1.6,
  fx: (a, s, A) => [
    ...emit('ink', 0.2, { x: s.x0, y: A.home.y + 10 * A.s, s: A.s * 1.05 })(a, s, A),
    ...emit('dust', 0.69, (a, s, A) => ({ x: s.x0, y: A.home.y + 118 * A.s }))(a, s, A),   // pops back clean (no second cloud over him)
  ],
  apply(c) {
    const { pose: p, u, w, lead, energy } = c;
    const brace = Math.sin(Math.PI * clamp(u / 0.24));
    const back = ease.inOut(clamp((u - 0.68) / 0.1)), pop = Math.sin(Math.PI * clamp((u - 0.68) / 0.22));
    p.alpha = u > 0.255 && u < 0.68 ? 0 : 1;
    p.eyes.blink = Math.max(p.eyes.blink, clamp(brace * 1.6 - 0.4));
    if (u > 0.68) { look(p, local(p, -80, 10), lead); p.eyes.wide += 0.4 * pop; }
    p.mouth.mode = u < 0.25 ? 'flat' : u > 0.68 && u < 0.88 ? 'o' : p.mouth.mode;
    return { sy: 1 - 0.2 * energy * brace + 0.18 * energy * pop * (1 - back * 0.5), lift: 18 * p.s * pop * w };
  },
});
