// Xiao Ke · the mood dial. One mood colours everything: face, skin, posture, tempo, bounce, limb life.
// Numeric fields blend; discrete modes (eye/mouth shapes) swap at the midpoint of a transition,
// hidden behind a blink (actor.js). Add moods here, never inside verbs.
import { MOOD_SKIN } from './palette.js';

const N = { eyes: { mode: 'open', lid: 0, tilt: 0, lidLow: 0, wide: 0, size: 1 }, brow: { show: 0, raise: 0, tilt: 0 },
  mouth: { mode: 'smile', amt: 0.6, open: 0 }, blush: 0.8, skin: [null, 0],
  posture: { sy: 0, rot: 0, splay: 0, arm: 0, drop: 0 }, tempo: 1, bounce: 1, wiggle: 1, gaze: 1 };

const m = (o) => ({
  ...N, ...o,
  eyes: { ...N.eyes, ...(o.eyes || {}) }, brow: { ...N.brow, ...(o.brow || {}) },
  mouth: { ...N.mouth, ...(o.mouth || {}) }, posture: { ...N.posture, ...(o.posture || {}) },
});

export const MOODS = {
  neutral: m({}),
  happy: m({ eyes: { lidLow: 0.38 }, mouth: { mode: 'open', amt: 0.8, open: 0.32 }, blush: 1, skin: [MOOD_SKIN.glow, 0.3],
    posture: { sy: 0.02 }, tempo: 1.12, bounce: 1.45, wiggle: 1.3 }),
  joy: m({ eyes: { mode: 'happy' }, mouth: { mode: 'open', amt: 1, open: 0.7 }, blush: 1.25, skin: [MOOD_SKIN.glow, 0.5],
    posture: { sy: 0.04, arm: 0.5 }, tempo: 1.25, bounce: 1.8, wiggle: 1.5 }),
  curious: m({ eyes: { wide: 0.22 }, brow: { show: 0.9, raise: 0.75 }, mouth: { mode: 'o', amt: 0.28 }, posture: { rot: 0.07 },
    tempo: 1.05, gaze: 1.5 }),
  proud: m({ eyes: { lid: 0.4, lidLow: 0.45 }, brow: { show: 0.9, raise: 0.35, tilt: -0.15 }, mouth: { mode: 'cat' }, blush: 1,
    skin: [MOOD_SKIN.glow, 0.55], posture: { sy: 0.05, rot: -0.03 }, tempo: 0.95, bounce: 1.1 }),
  shy: m({ eyes: { lid: 0.18 }, mouth: { mode: 'wavy', amt: 0.4 }, blush: 1.5, skin: [MOOD_SKIN.shy, 0.7],
    posture: { sy: -0.05, drop: 0.3 }, tempo: 0.8, bounce: 0.6, gaze: 0.6 }),
  nervous: m({ eyes: { wide: 0.12 }, brow: { show: 1, raise: 0.5, tilt: -0.6 }, mouth: { mode: 'wavy', amt: 0.7 }, blush: 0.4,
    skin: [MOOD_SKIN.pale, 0.25], posture: { sy: -0.03, splay: -0.05 }, tempo: 1.35, bounce: 0.8, wiggle: 1.7, gaze: 2.2 }),
  determined: m({ eyes: { lid: 0.3, tilt: 0.25 }, brow: { show: 0.85, tilt: 0.5, raise: -0.2 }, mouth: { mode: 'flat' }, blush: 0.5,
    posture: { sy: 0.02, rot: 0.02 }, tempo: 1.1, bounce: 0.9 }),
  angry: m({ eyes: { lid: 0.38, tilt: 0.45 }, brow: { show: 1, tilt: 0.9, raise: -0.6 }, mouth: { mode: 'frown', amt: 0.8 }, blush: 0,
    skin: [MOOD_SKIN.angry, 0.55], posture: { sy: -0.02 }, tempo: 1.2, bounce: 0.7 }),
  sad: m({ eyes: { lid: 0.3, tilt: -0.5 }, brow: { show: 1, tilt: -0.9, raise: 0.4 }, mouth: { mode: 'frown', amt: 0.6 }, blush: 0.3,
    skin: [MOOD_SKIN.cold, 0.6], posture: { sy: -0.08, drop: 0.6, arm: -0.4 }, tempo: 0.7, bounce: 0.4, wiggle: 0.6, gaze: 0.5 }),
  shock: m({ eyes: { mode: 'dot' }, mouth: { mode: 'o', amt: 1, open: 1 }, blush: 0, skin: [MOOD_SKIN.pale, 0.85],
    posture: { sy: 0.12, splay: 0.15, arm: 0.6 }, tempo: 1.4, bounce: 0.3, wiggle: 0.3, gaze: 0 }),
  sleepy: m({ eyes: { mode: 'content' }, mouth: { mode: 'o', amt: 0.1 }, blush: 0.5, posture: { sy: -0.06, rot: -0.08, drop: 0.5 },
    tempo: 0.5, bounce: 0.3, wiggle: 0.5, gaze: 0 }),
  dizzy: m({ eyes: { mode: 'spiral' }, mouth: { mode: 'wavy', amt: 0.8 }, blush: 0.4, posture: { rot: 0.08 }, tempo: 0.8, wiggle: 1.4, gaze: 0 }),
};

const lerp = (a, b, t) => a + (b - a) * t;
function blendObj(a, b, t) { const o = {}; for (const k of Object.keys(a)) o[k] = typeof a[k] === 'number' ? lerp(a[k], b[k] ?? a[k], t) : t < 0.5 ? a[k] : b[k]; return o; }

/** Blend two moods (names or objects) by t; discrete fields switch at 0.5. */
export function blendMood(A, B, t) {
  const a = typeof A === 'string' ? MOODS[A] : A, b = typeof B === 'string' ? MOODS[B] : B;
  if (t <= 0) return a; if (t >= 1) return b;
  return {
    eyes: blendObj(a.eyes, b.eyes, t), brow: blendObj(a.brow, b.brow, t), mouth: blendObj(a.mouth, b.mouth, t),
    posture: blendObj(a.posture, b.posture, t), blush: lerp(a.blush, b.blush, t),
    skinA: a.skin, skinB: b.skin, skinT: t,
    tempo: lerp(a.tempo, b.tempo, t), bounce: lerp(a.bounce, b.bounce, t), wiggle: lerp(a.wiggle, b.wiggle, t), gaze: lerp(a.gaze, b.gaze, t),
    swap: (a.eyes.mode !== b.eyes.mode || a.mouth.mode !== b.mouth.mode),
  };
}

/** Extension point: add a mood from a new file (puppet/moods-extra.js). Fields default to neutral. */
export function defineMood(name, o) { if (MOODS[name]) throw new Error('mood exists: ' + name); MOODS[name] = m(o); }
