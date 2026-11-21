import { Actor } from './actor.js';
import { drawFx } from './fx.js';
import { drawExtendedBubble, extendedBubbleVoiceEvents } from './bubbles-extra.js';
import { clamp, lerp, hash } from './math.js';

const step = 1 / 60;

// Find the last checkpoint at or before t, with a constant-time forward path.
function atOrBefore(points, t, last) {
  if (points[last] <= t && !(points[last + 1] <= t)) return last;
  if (points[last + 1] <= t && !(points[last + 2] <= t)) return last + 1;
  let low = -1, high = points.length;
  while (high - low > 1) {
    const mid = (low + high) >>> 1;
    if (points[mid] <= t) low = mid;
    else high = mid;
  }
  return low;
}

export class CachedActor extends Actor {
  voiceEvents() {
    return this.bubbles.flatMap(extendedBubbleVoiceEvents).sort((a, b) => a.t - b.t);
  }

  constructor(options) {
    super(options);
    this.life = { times: [0], sums: [0], tempos: [], index: 0 };
    this.gaze = { times: [0], values: [], index: 0 };
    this.blinkIndex = -1;
  }

  feel(name, options) {
    const { times, sums, tempos } = this.life;
    const keep = atOrBefore(times, this.cursor, this.life.index) + 1;
    times.length = sums.length = Math.max(1, keep);
    tempos.length = Math.min(tempos.length, Math.max(0, keep - 1));
    this.life.index = 0;
    const result = super.feel(name, options);
    const effects = { confused: 'question', embarrassed: 'sweat', excited: 'sparkle', angry: 'steam' };
    if (effects[name] && options?.pop !== false) {
      this.fx.push({ kind: effects[name], t: this.moods.at(-1).t + 0.21, follow: true });
    }
    return result;
  }

  _lifeTime(t) {
    if (t <= 0) return 0;
    const { times, sums, tempos } = this.life;
    while (times.at(-1) < t) {
      const start = times.at(-1);
      const tempo = this.moodAt(start).m.tempo;
      times.push(start + step);
      sums.push(sums.at(-1) + tempo * step);
      tempos.push(tempo);
    }
    const i = this.life.index = atOrBefore(times, t, this.life.index);
    return sums[i] + (t - times[i] ? tempos[i] * (t - times[i]) : 0);
  }

  _blinkAt(t) {
    if (!this._blinks) super._blinkAt(0);
    const i = this.blinkIndex = atOrBefore(this._blinks, t, this.blinkIndex);
    const start = this._blinks[i];
    return t < start + 0.17 ? Math.sin(Math.PI * (t - start) / 0.17) ** 0.6 : 0;
  }

  _saccade(t) {
    if (t < 0) return [0, 0];
    const { times, values } = this.gaze;
    while (times.at(-1) <= t) {
      const k = values.length;
      values.push([(hash(this.seed * 17 + k * 3) - 0.5) * 0.7, (hash(this.seed * 29 + k * 5) - 0.5) * 0.45]);
      times.push(times.at(-1) + (0.7 + hash(this.seed * 41 + k) * 1.7));
    }
    const i = this.gaze.index = atOrBefore(times, t, this.gaze.index);
    const previous = values[i - 1] ?? [0, 0];
    const u = clamp((t - times[i]) / 0.07);
    return values[i].map((value, axis) => lerp(previous[axis], value, u));
  }
  poseAt(t) {
    const p = super.poseAt(t);
    const segment = this.segAt(t);
    if (!segment || segment.kind === 'idle') {
      const name = this.moodNameAt(t);
      const target = { thinking: [0.54, -0.68], embarrassed: [-0.64, 0.33], bored: [0.55, 0.18] }[name];
      if (target) {
        const event = this.moods.findLast(e => e.t <= t) ?? this.moods[0];
        const w = clamp((t - event.t) / Math.max(event.dur, 0.01));
        p.look = p.look.map((value, axis) => lerp(value, target[axis], w * 0.86));
      }
    }
    return p;
  }

  drawOverlays(ctx, env, t, opts = {}) {
    for (const e of this.fx) {
      const time = t - e.t;
      if (time < 0 || time > (e.duration ?? 2)) continue;
      const head = e.anchor ?? (e.follow ? this.headAt(e.t + Math.min(time, 0.01)) : null);
      drawFx(ctx, { ...e, x: head?.x ?? e.x, y: head?.y ?? e.y, s: e.s ?? this.s }, time);
    }
    for (const b of this.bubbles) {
      const time = t - b.t0;
      if (time < 0 || time > b.dur) continue;
      const swatAt = this.segs.find(s => s.kind === 'batAway' && s.t0 >= b.t0 && s.t0 + 0.32 <= t);
      const swat = swatAt ? (t - swatAt.t0 - 0.32) / 0.52 : 0;
      if (swat >= 1) continue;
      const h = this.headAt(t);
      const tip = [h.x + (b.tipDx ?? 34) * this.s, h.y - (b.tipDy ?? 16) * this.s];
      drawExtendedBubble(ctx, b, time, { tip, s: opts.bubbleScale ?? 1, frame: [env.width, env.height] },
        this.moodNameAt(t) === 'nervous', swat);
    }
  }

}

export class LiveActor extends CachedActor {
  pointer = null;

  queue(now, verb, ...args) {
    this.trim(now);
    this.at(verb === 'feel' || verb === 'say' || verb === 'lookAt' ? now : Math.max(now, ...this.segs.map(s => s.t1)));
    return this[verb](...args);
  }

  trim(now) {
    this._lifeTime(now);
    if (this.segs.some(s => s.t1 <= now && s.x1 !== undefined)) {
      for (const e of this.fx) if (e.follow && !e.anchor && e.t + 0.01 < now && e.t + (e.duration ?? 2) > now) {
        e.anchor = this.headAt(e.t + 0.01);
      }
      for (const s of this.segs) if (s.t1 <= now && s.x1 !== undefined) this.home.x = s.x1;
    }
    for (const s of this.segs) if (s.kind === 'batAway' && s.t1 <= now) {
      this.bubbles = this.bubbles.filter(b => b.t0 > s.t0);
    }
    this.segs = this.segs.filter(s => s.t1 > now);
    this.bubbles = this.bubbles.filter(b => b.t0 + b.dur > now);
    this.looks = this.looks.filter(l => l.t1 > now);
    this.fx = this.fx.filter(e => e.t + (e.duration ?? 2) > now);
    this.pops = this.pops.filter(p => p.t + 1.2 > now);
    const mood = this.moods.findLastIndex(e => e.t <= now);
    if (mood > 1) this.moods.splice(0, mood - 1);
  }

  poseAt(t) {
    const p = super.poseAt(t);
    if (this.pointer && !this.segAt(t) && !this.looks.some(l => t >= l.t0 && t <= l.t1)) {
      const dx = this.pointer[0] - p.x, dy = this.pointer[1] - p.y;
      const d = Math.max(60, Math.hypot(dx, dy));
      p.look = [0.95 * dx / d, 0.8 * dy / d];
    }
    return p;
  }
}

export function browserEnv() {
  const pool = new Map();
  const limit = 64;
  let frame = 0;
  return {
    scale: globalThis.devicePixelRatio || 1, width: 0, height: 0,
    beginFrame(width, height, scale = globalThis.devicePixelRatio || 1) {
      Object.assign(this, { width, height, scale });
      frame++;
    },
    createCanvas(w, h) {
      const key = w + 'x' + h;
      let entry = pool.get(key);
      if (!entry) entry = { frame, used: 0, canvases: [] };
      if (entry.frame !== frame) {
        entry.frame = frame;
        entry.used = 0;
      }
      pool.delete(key);
      pool.set(key, entry);
      if (pool.size > limit) pool.delete(pool.keys().next().value);
      let canvas = entry.canvases[entry.used];
      if (!canvas) {
        canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        entry.canvases.push(canvas);
      } else {
        const ctx = canvas.getContext('2d');
        if (typeof ctx.reset === 'function') ctx.reset();
        else {
          ctx.resetTransform();
          ctx.clearRect(0, 0, w, h);
        }
      }
      entry.used++;
      return canvas;
    },
  };
}
