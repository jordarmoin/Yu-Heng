// Xiao Ke · speech bubbles. Xiao Ke never speaks aloud: the bubble IS its voice, so it is drawn in
// the character's own cel language (warm line with the weighted shadow-side offset, cream sheet fill)
// and it behaves physically: pops from the tail root, types on, follows the head, shrinks away.
// Styles: speech · think · shout · code. Shape carries the tone; text stays plain and readable.
import { SKIN, WEB } from './palette.js';
import { TAU, clamp, ease, lerp } from './math.js';

export const BUBBLE = {
  fill: '#FFFDF9', line: SKIN.line, text: '#3B2A24', sub: '#8B8177', lw: 2.8, shift: [2.2, 2.6],
  font: '500 32px "Resource Han Rounded SC"', bold: '700 34px "Resource Han Rounded SC"', subFont: '400 19px "Resource Han Rounded SC"',
  mono: '400 24px "JetBrains Mono", "Resource Han Rounded SC"', lh: 46, pad: 26, r: 28,
  codeFill: '#1E1F24', codeText: '#ECE5D8', codeAccent: WEB.accentNight,
};

const TYPE_START = 0.2;
const typingRate = b => b.cps ?? 14;
const glyphCount = (b, elapsed) => Math.floor(Math.max(0, elapsed - TYPE_START) * typingRate(b) + 1e-9);
const glyphTime = (b, index) => TYPE_START + (index + 1) / typingRate(b);

export function bubbleVoiceEvents(b) {
  // drawBubble wraps the text but consumes no typing slot for a hard line break.
  return Array.from(b.text.replaceAll('\n', '')).flatMap((glyph, index) => {
    const t = b.t0 + glyphTime(b, index);
    if (/[，。？！]/u.test(glyph)) return [{ t, kind: 'end' }];
    if (glyph === '✓' || /[\s\p{P}\p{Cf}]/u.test(glyph)) return [];
    return [{ t, kind: 'glyph' }];
  });
}

export function bubbleDuration(b) { return TYPE_START + b.text.length / typingRate(b) + (b.hold ?? 1.6) + 0.24; }

function wrap(ctx, text, w) {
  const out = []; let line = '';
  for (const ch of text) {
    if (ch === '\n') { out.push(line); line = ''; continue; }
    if (ctx.measureText(line + ch).width > w && line) { out.push(line); line = ch; } else line += ch;
  }
  if (line) out.push(line);
  return out;
}

function rrect(p, x, y, w, h, r) {
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath();
}
function cloud(p, x, y, w, h) {
  const bumps = [], per = 2 * (w + h), n = Math.max(10, Math.round(per / 70));
  for (let i = 0; i < n; i++) {
    let d = (i / n) * per, px, py;
    if (d < w) { px = x + d; py = y; } else if ((d -= w) < h) { px = x + w; py = y + d; } else if ((d -= h) < w) { px = x + w - d; py = y + h; } else { d -= w; px = x; py = y + h - d; }
    bumps.push([px, py]);
  }
  for (const [px, py] of bumps) { p.moveTo(px + 30, py); p.arc(px, py, 30, 0, TAU); }
  rrect(p, x, y, w, h, 24);
}
function burst(p, cx, cy, rx, ry, n = 18) {
  for (let i = 0; i <= 2 * n; i++) {
    const a = (i / (2 * n)) * TAU, k = i % 2 ? 1.0 : 1.22 + 0.06 * Math.sin(i * 2.7);
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
}

/**
 * @param b   { text, sub?, style?, box?:[x,y], w?, cps?, hold? }
 * @param τ   seconds since the bubble started
 * @param o   { tip:[x,y] (where the tail points: Xiao Ke's head), s: scale }
 */
export function drawBubble(ctx, b, τ, o) {
  const style = b.style || 'speech', s = o.s ?? 1, B = BUBBLE;
  const dur = b.dur ?? bubbleDuration(b);
  const tip = o.tip;
  ctx.save();
  ctx.font = style === 'code' ? B.mono : style === 'shout' ? B.bold : B.font;
  const w = b.w ?? 400;
  const lines = wrap(ctx, b.text, w - 2 * B.pad);
  const subH = b.sub ? 30 : 0;
  const h = B.pad * 2 + lines.length * B.lh - 8 + subH;
  let box = b.box;
  if (!box) { // default: sit just above-right of the head, short fat tail; stay inside the frame
    const F = o.frame ?? [1920, 1080];
    let bx = tip[0] - 56, by = tip[1] - h - 44;
    if (bx + w > F[0] - 24) bx = tip[0] - w + 56;
    box = [clamp(bx, 24, F[0] - w - 24), Math.max(24, by)];
  }
  const [x, y] = box;
  // tail root: on the box edge nearest the tip
  const rootX = clamp(tip[0] + 18, x + 50, x + w - 50), below = tip[1] > y + h / 2;
  const ry = below ? y + h - 3 : y + 3;
  // pop in / out (scale about the tail root)
  const tin = ease.outBack(clamp(τ / 0.26), 2.4), tout = 1 - ease.in(clamp((τ - (dur - 0.22)) / 0.22));
  const sc = Math.max(0.01, (0.25 + 0.75 * tin) * (0.55 + 0.45 * tout));
  ctx.globalAlpha *= clamp(τ / 0.08) * tout;
  ctx.translate(rootX, ry); ctx.scale(sc * s, sc * s); ctx.translate(-rootX, -ry);

  const shape = new Path2D();
  if (style === 'think') cloud(shape, x, y, w, h);
  else if (style === 'shout') burst(shape, x + w / 2, y + h / 2, w * 0.56, h * 0.62);
  else rrect(shape, x, y, w, h, B.r);
  const tail = new Path2D();
  if (style === 'think') {
    for (const [k, r] of [[0.35, 13], [0.62, 9], [0.84, 6]]) {
      const px = lerp(rootX, tip[0], k), py = lerp(ry, tip[1], k);
      tail.moveTo(px + r, py); tail.arc(px, py, r, 0, TAU);
    }
  } else {
    const dir = tip[0] < rootX ? -1 : 1, bw = 46;
    tail.moveTo(rootX - bw / 2, ry);
    tail.quadraticCurveTo(rootX + dir * 4, lerp(ry, tip[1], 0.55), tip[0], tip[1]);
    tail.quadraticCurveTo(rootX + bw * 0.6, lerp(ry, tip[1], 0.35), rootX + bw / 2, ry);
    tail.closePath();
  }
  const fill = style === 'code' ? B.codeFill : B.fill;
  // weighted line under, fill on top (inner seams vanish like on the body)
  ctx.save(); ctx.translate(B.shift[0], B.shift[1]); ctx.fillStyle = B.line; ctx.fill(shape); ctx.fill(tail); ctx.restore();
  ctx.strokeStyle = B.line; ctx.lineJoin = 'round'; ctx.lineWidth = 2 * B.lw;
  ctx.stroke(shape); ctx.stroke(tail);
  ctx.fillStyle = fill; ctx.fill(shape); ctx.fill(tail);
  if (style !== 'code') { // a soft cel highlight along the top edge
    ctx.save(); ctx.clip(shape);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(x + 34, y + 12, 22, 5, -0.15, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // typed text
  const shown = glyphCount(b, τ);
  let left = shown;
  ctx.fillStyle = style === 'code' ? B.codeText : B.text;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  lines.forEach((ln, i) => {
    if (left <= 0) return;
    const part = [...ln].slice(0, left).join('');
    left -= [...ln].length;
    let tx = x + B.pad;
    if (style === 'code' && i === 0) { ctx.fillStyle = B.codeAccent; ctx.fillText('›', tx, y + B.pad + 30 + i * B.lh); tx += 22; ctx.fillStyle = B.codeText; }
    ctx.fillText(part, tx, y + B.pad + 30 + i * B.lh);
  });
  if (b.sub && left > -2) {
    ctx.font = B.subFont; ctx.fillStyle = B.sub;
    ctx.globalAlpha *= clamp((τ - TYPE_START - b.text.length / typingRate(b)) / 0.3);
    ctx.fillText(b.sub, x + B.pad + 2, y + h - B.pad + 4);
  }
  ctx.restore();
}
