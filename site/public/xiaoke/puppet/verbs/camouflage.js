import { register, look, local } from './common.js';
import { clamp, ease, mixHex } from '../math.js';
import { derive, WEB } from '../palette.js';

// Polish (Claude): the octopus trick. Default target is the page itself (WEB.paper), so Xiao Ke melts into
// the /app/ paper and only his eyes stay, glancing left and right, then a wink of colour comes back.
// 0–0.2 glance · 0.2–0.8 colour wash (from the feet up is implied by the slow ease) · hold · 0.6 s return.
register('camouflage', {
  duration: 2.4,
  apply(c) {
    const { pose: p, a, t, D, u, w, lead, energy } = c;
    const k = ease.inOut((t - 0.15) / 0.6) * ease.inOut((D - t) / 0.55);
    const skin = derive(a.color ?? WEB.paper);
    p.skin = Object.fromEntries(Object.keys(skin).map(key => [key,
      mixHex(p.skin[key], key === 'line' ? mixHex(skin.line, skin.base, 0.8) : skin[key], k)]));
    p.blush *= 1 - k;
    const sneak = clamp((u - 0.35) / 0.4);
    if (sneak > 0 && sneak < 1) look(p, local(p, Math.sin(sneak * Math.PI * 2) * 150, 0), 1);
    else look(p, local(p, 0, 20), lead);
    p.eyes.lid += 0.2 * k; p.mouth.mode = k > 0.5 ? 'flat' : p.mouth.mode;
    p.wiggle *= 1 - 0.8 * k;                                    // hold still while hidden
    return { sy: 1 - 0.05 * energy * (1 - k) };
  },
}, (color, o = {}) => ({ ...o, color }));
