import { register, gesture, face, reach, local } from './common.js';
import { clamp, ease } from '../math.js';

// Polish (Claude): a real yawn. 0–0.15 inhale (eyes squeeze, mouth starts) · 0.15–0.6 big stretch tall with
// both arms up and curled · 0.55–0.8 one arm pats the open mouth (front layer, below the eyes) · 0.8–1 smack, settle.
register('yawn', {
  duration: 1.9,
  apply(c) {
    const { pose: p, u, w, arm, energy } = c;
    face(p, w, 'squeeze', 'open');
    const open = clamp(u / 0.18) * (1 - ease.inOut(clamp((u - 0.78) / 0.1)));
    p.mouth.open = Math.max(p.mouth.open, 0.95 * open);
    const up = Math.sin(Math.PI * clamp((u - 0.08) / 0.55));
    gesture(p, -1, arm * up, -1.15, 96, 0.9);
    const pat = Math.sin(Math.PI * clamp((u - 0.5) / 0.32));
    if (pat > 0.02) {
      const tap = 4 * Math.sin(Math.PI * 2 * clamp((u - 0.56) / 0.2) * 2) * (pat > 0.6 ? 1 : 0);
      reach(c, local(p, 6, 26 + tap), arm * pat, 0.9, true, 1);
    } else gesture(p, 1, arm * up, -1.15, 96, -0.9);
    if (u > 0.8) p.mouth.mode = 'cat';
    return { sy: 1 + 0.15 * energy * up - 0.05 * energy * Math.sin(Math.PI * clamp((u - 0.8) / 0.2)) };
  },
});
