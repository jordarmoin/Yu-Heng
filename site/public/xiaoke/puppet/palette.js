// Xiao Ke · colour tokens. Tuned to the workbench web palette (design/css/tokens.css):
// the body lives in the --accent terracotta family (#c4603d day, #e48b67 night), eyes are --ink,
// the rim is --sheet, blush leans to --cinnabar. Name by role, never by value.
import { hexToHsl, hslToHex, mixHex } from './math.js';

export const WEB = {
  paper: '#f6f0e5', sheet: '#fbf8f2', ink: '#29231f', accent: '#c4603d', accentNight: '#e48b67',
  cinnabar: '#b53f2c', codex: '#3c5a8c', pine: '#477565', ochre: '#b07a24', plum: '#7a4669',
  nightPaper: '#1c1f2c', nightSheet: '#23273a',
};

// The canonical skin (hand-picked; derive() reproduces it closely for other base colours).
export const SKIN = {
  base: '#E2714E',    // body
  shade: '#C4553B',   // cel shadow
  shade2: '#A9432F',  // cast shadow under the body, deepest
  light: '#F49C7A',   // cel highlight band
  gloss: '#FFE4D6',   // specular ticks
  under: '#F5B79C',   // paler underside of the arms
  sucker: '#FCD9C7',  // suckers
  suckerRing: '#D9826A',
  line: '#4A2117',    // outline (warm, from --ink towards terracotta)
};

export const FACE = {
  eye: WEB.ink,
  glint: '#FFFFFF',
  mouth: WEB.ink,
  mouthIn: '#5A2A22',
  tongue: '#EE7E72',
  blush: '#D9443A',
  rim: WEB.sheet,
};

/** Derive a full skin from one base colour (moods, camouflage). Keeps the canonical relationships. */
export function derive(base) {
  const [h, s, l] = hexToHsl(base);
  return {
    base,
    shade: hslToHex(h - 3, s - 2, l - 10.5),
    shade2: hslToHex(h - 5, s - 8, l - 18),
    light: hslToHex(h + 3, s + 4, l + 11),
    gloss: hslToHex(h + 6, Math.min(100, s + 20), Math.min(96, l + 31)),
    under: hslToHex(h + 4, s - 6, l + 19),
    sucker: hslToHex(h + 6, s - 2, l + 27),
    suckerRing: hslToHex(h + 2, s - 18, l + 2),
    line: hslToHex(h - 2, Math.min(62, s * 0.55), Math.max(12, Math.min(19, l * 0.28))),
  };
}

/** Mood colours: what the whole body flushes to. 0 = canon terracotta. */
export const MOOD_SKIN = {
  canon: SKIN.base,
  shy: '#E0483F',      // whole-body blush
  angry: '#C8382C',
  pale: '#F1D4C4',     // fright drains the colour
  cold: '#C99A90',     // sad / low
  glow: '#F07B4F',     // proud / happy, slightly warmer and brighter
  sick: '#B8A27A',
};

/** Blend the canonical skin towards a target colour by t (0..1). Returns a full skin. */
export function skinToward(target, t) {
  if (!target || t <= 0) return SKIN;
  const d = derive(mixHex(SKIN.base, target, Math.min(1, t)));
  const out = {};
  for (const k of Object.keys(SKIN)) out[k] = mixHex(SKIN[k], d[k], Math.min(1, t));
  return out;
}
