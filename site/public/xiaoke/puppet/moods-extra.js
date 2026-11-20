import { defineMood, MOODS } from './moods.js';
import { MOOD_SKIN } from './palette.js';

defineMood('excited', {
  eyes: { wide: 0.75 }, mouth: { mode: 'open', amt: 1, open: 0.56 },
  skin: [MOOD_SKIN.glow, 0.7], blush: 1.2, posture: { sy: 0.065, arm: 0.65 },
  tempo: 1.54, bounce: 1.9, wiggle: 1.65,
});
defineMood('thinking', {
  brow: { show: 0.78, raise: 0.44, tilt: -0.45 }, eyes: { lid: 0.26, tilt: 0.18 },
  mouth: { mode: 'flat', amt: 0.44 }, posture: { rot: -0.1, arm: 0.24 }, tempo: 0.82,
});
defineMood('confused', {
  brow: { show: 1, raise: 0.15, tilt: 0.72 }, eyes: { wide: 0.32, tilt: -0.24, lid: 0.14 },
  mouth: { mode: 'wavy', amt: 0.8 }, posture: { rot: 0.16, sy: -0.02 }, gaze: 1.7,
});
defineMood('relieved', {
  eyes: { mode: 'content' }, mouth: { mode: 'smile', amt: 1 }, skin: [MOOD_SKIN.pale, 0.12],
  posture: { sy: -0.04, splay: 0.12 }, tempo: 0.76, bounce: 0.65,
});
defineMood('embarrassed', {
  ...MOODS.shy, eyes: { lid: 0.46, lidLow: 0.22 }, mouth: { mode: 'cat', amt: 0.48 },
  posture: { sy: -0.076, rot: 0.12, arm: -0.3 }, blush: 1.75, skin: [MOOD_SKIN.shy, 0.9],
});
defineMood('bored', {
  eyes: { lid: 0.55 }, mouth: { mode: 'flat', amt: 0.32 },
  skin: [MOOD_SKIN.cold, 0.33], posture: { sy: -0.09, rot: -0.13, arm: -0.4 },
  tempo: 0.56, bounce: 0.2, wiggle: 0.45,
});
defineMood('focused', { ...MOODS.determined, tempo: 0.86 });
