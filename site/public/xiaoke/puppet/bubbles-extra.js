import { BUBBLE, bubbleVoiceEvents, drawBubble } from './bubble.js';
import { clamp, ease, hash } from './math.js';
import { WEB } from './palette.js';

export const BUBBLE_STYLES = new Map();
export function defineBubbleStyle(name, draw) {
  if (BUBBLE_STYLES.has(name)) throw new Error('Bubble style exists: ' + name);
  BUBBLE_STYLES.set(name, draw);
}

defineBubbleStyle('whisper', (ctx, bubble, time, options) => {
  ctx.globalAlpha *= 0.68;
  drawBubble(ctx, { ...bubble, style: 'speech' }, time, { ...options, s: options.s * 0.76 });
});
defineBubbleStyle('card', (ctx, bubble, time, options) => {
  drawBubble(ctx, { ...bubble, style: 'speech', w: bubble.w ?? 350 }, time, options);
});
function listBubble(bubble) {
  const lines = bubble.text.split('\n').slice(0, 4);
  const text = lines.map(line => '✓ ' + line).join('\n');
  return { ...bubble, style: 'speech', text, cps: (bubble.cps ?? 14) * text.length / Math.max(bubble.text.length, 1) };
}
defineBubbleStyle('list', (ctx, bubble, time, options) => drawBubble(ctx, listBubble(bubble), time, options));

export function extendedBubbleVoiceEvents(bubble) {
  const rendered = bubble.style === 'list' ? listBubble(bubble) : bubble;
  return bubbleVoiceEvents(rendered);
}

export function drawExtendedBubble(ctx, bubble, time, options, nervous, swat) {
  const { tip } = options;
  ctx.save();
  if (nervous) {
    const frame = Math.floor(time * 24);
    ctx.translate((hash(frame * 31) - 0.5) * 5, (hash(frame * 11) - 0.5) * 4);
  }
  if (bubble.style === 'shout') ctx.translate(4 * Math.sin(time * 67) * Math.exp(-time * 3), 2 * Math.cos(time * 78) * Math.exp(-time * 3));
  if (swat > 0) {
    const k = ease.out(swat);
    ctx.translate(tip[0] + 290 * k, tip[1] - 125 * Math.sin(k * Math.PI / 2));
    ctx.rotate(k * 1.58);
    ctx.translate(-tip[0], -tip[1]);
    ctx.globalAlpha *= 1 - clamp(swat);
  }
  (BUBBLE_STYLES.get(bubble.style) ?? drawBubble)(ctx, bubble, time, options);
  ctx.restore();
}
