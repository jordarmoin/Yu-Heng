// Xiao Ke puppet · small math kit (deterministic, no globals, no Math.random).

export const TAU = Math.PI * 2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const remap = (x, a, b, c = 0, d = 1) => lerp(c, d, clamp((x - a) / (b - a)));

// ---- easing (t in 0..1)
export const ease = {
  linear: (t) => clamp(t),
  inOut: smooth,
  in: (t) => clamp(t) ** 2,
  out: (t) => 1 - (1 - clamp(t)) ** 2,
  outCubic: (t) => 1 - (1 - clamp(t)) ** 3,
  inCubic: (t) => clamp(t) ** 3,
  // anticipation: dips below 0 first, then goes to 1
  back: (t, k = 1.7) => { t = clamp(t); return t * t * ((k + 1) * t - k); },
  // overshoot past 1, settle
  outBack: (t, k = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((k + 1) * t + k); },
  // damped wobble settling at 1 (zeta ~ damping, w ~ wobbles)
  outElastic: (t, w = 3.2, zeta = 4.5) => { t = clamp(t); return 1 - Math.exp(-zeta * t) * Math.cos(w * TAU * t * 0.5); },
};

// analytic damped spring step response: value of a spring released at time 0 from 0 towards 1.
export function springStep(t, freq = 2.2, damp = 0.45) {
  if (t <= 0) return 0;
  const w = freq * TAU;
  const z = Math.min(0.999, damp);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}

// ---- seeded randomness
export function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
export function rng(seed) {
  let a = (seed | 0) + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// smooth 1-D value noise in -1..1
export function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash(i * 7919 + seed * 104729) * 2 - 1;
  const b = hash((i + 1) * 7919 + seed * 104729) * 2 - 1;
  return lerp(a, b, smooth(f));
}
// two octaves, gentle
export const wobble = (x, seed = 0) => 0.68 * noise(x, seed) + 0.32 * noise(x * 2.3 + 17.1, seed + 3);

// ---- colour
export function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function rgbToHex([r, g, b]) {
  const c = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
export function mixHex(a, b, t) {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]);
}
export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${+clamp(a).toFixed(4)})`;
}
export function hexToHsl(hex) {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s / 100); l = clamp(l / 100);
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
