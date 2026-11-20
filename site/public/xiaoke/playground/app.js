import { LiveActor, browserEnv, WEB } from '../puppet/index.js';
import { FAMILIES, LABELS, MOOD_LABELS, direct } from '../library/actions.mjs';

const stage = document.querySelector('.stage');
const canvas = stage.querySelector('canvas');
const ctx = canvas.getContext('2d');
const env = browserEnv();
const actor = new LiveActor({ seed: 11 });
const start = performance.now();
const size = document.querySelector('#size');
const rim = document.querySelector('#rim');
let width = 0, height = 0;
let selected = 'neutral';
let side = 1;
const catalogLabels = {
  prop: {
    pointer: '教鞭', magnifier: '放大镜', laptop: '笔记本电脑', keyboard: '键盘', sign: '标牌',
    cardboard: '纸箱', packet: '数据包', cable: '线缆', wrench: '扳手', hat: '安全帽',
    coffee: '咖啡杯', flag: '旗子', lever: '拉杆', stamp: '印章', bulb: '灯泡',
  },
  server: { front: '前台', brain: '大脑', box: '工作站' },
  bubble: { whisper: '悄悄话', list: '清单', card: '卡片', nervous: '紧张气泡', shout: '大声喊' },
  effect: {
    ripple: '涟漪', sparkle: '闪光', sweat: '汗滴', dust: '扬尘', ink: '墨团', inkTrail: '墨迹',
    trail: '描线', speedLines: '速度线', heart: '爱心', anger: '生气符号', question: '问号',
    exclaim: '叹号', zzz: '睡意', notes: '音符', confetti: '彩纸', bulb: '点子',
    dizzy: '转星星', steam: '蒸汽', tears: '眼泪', smear: '残影', fillRing: '进度环',
  },
};

for (const [name, value] of Object.entries(WEB)) document.documentElement.style.setProperty('--' + name, value);
const now = () => (performance.now() - start) / 1000;

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const dpr = devicePixelRatio;
  if (w !== width || h !== height || canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    width = w;
    height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    if (!actor.segs.length) actor.home.x = actor._x = w / 2;
  }
  actor.s = Number(size.value) / 256;
  actor.home.y = height * 0.61 - 34 * actor.s;
}

function draw(time) {
  resize();
  const t = (time - start) / 1000;
  actor.trim(Math.max(0, t));
  actor.rim = Number(rim.checked);
  env.beginFrame(width, height);
  ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  actor.draw(ctx, env, Math.max(0, t), { bubbleScale: width < 460 ? 0.8 : 1 });
  requestAnimationFrame(draw);
}

function pointer(event) {
  const bounds = canvas.getBoundingClientRect();
  return [event.clientX - bounds.left, event.clientY - bounds.top];
}
canvas.addEventListener('pointermove', event => { actor.pointer = pointer(event); });
canvas.addEventListener('pointerleave', () => { actor.pointer = null; });
canvas.addEventListener('click', event => {
  const target = pointer(event), t = now();
  const dx = target[0] - actor._x, dy = target[1] - actor.home.y;
  const reach = Math.sqrt(Math.max(0, (220 * actor.s) ** 2 - dy ** 2));
  if (Math.abs(dx) > reach + 48 * actor.s) {
    const margin = Math.min(width / 2, 126 * actor.s);
    const step = target[0] - Math.sign(dx) * Math.max(60 * actor.s, reach);
    actor.queue(t, 'walkTo', Math.max(margin, Math.min(width - margin, step)));
  }
  actor.queue(t, 'tap', target);
});

function buttons(parent, labels, handler) {
  for (const [name, label] of Object.entries(labels)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.name = name;
    button.addEventListener('click', () => handler(name));
    parent.append(button);
  }
}
const moods = document.querySelector('#moods');
function markMood() {
  for (const button of moods.children) button.setAttribute('aria-pressed', String(button.dataset.name === selected));
}
buttons(moods, MOOD_LABELS, name => {
  selected = name;
  actor.queue(now(), 'feel', name);
  markMood();
});
markMood();
const onAction = name => {
  const t = now();
  actor.trim(t);
  actor.at(Math.max(t, ...actor.segs.map(s => s.t1)));
  if (name === 'feel') {
    selected = selected === 'curious' ? 'neutral' : 'curious';
    actor.queue(t, 'feel', selected);
    markMood();
  } else direct(actor, name, { width, height, side, live: true });
  side = -side;
};
for (const [title, names] of FAMILIES) {          // polish: grouped by what the action is for
  const group = document.createElement('div');
  group.className = 'family';
  const caption = document.createElement('h3');
  caption.textContent = title;
  const row = document.createElement('div');
  row.className = 'buttons';
  buttons(row, Object.fromEntries(names.map(n => [n, LABELS[n]])), onAction);
  group.append(caption, row);
  document.querySelector('#actions').append(group);
}

function rimDefault() {
  rim.checked = Number(size.value) <= 120 || ['night', 'code'].includes(stage.dataset.background);
}
document.querySelector('#background').addEventListener('change', event => {
  stage.dataset.background = event.target.value;
  rimDefault();
});
let small = Number(size.value) <= 120;
size.addEventListener('input', () => {
  document.querySelector('output').textContent = size.value + ' px';
  const next = Number(size.value) <= 120;
  if (small !== next) rimDefault();
  small = next;
});
document.querySelector('#speech').addEventListener('submit', event => {
  event.preventDefault();
  const text = document.querySelector('#words').value.trim();
  if (text) actor.queue(now(), 'say', text, { w: Math.min(300, width - 48) });
});

const catalog = document.querySelector('#catalog');
const kind = document.querySelector('#kind');
try {
  const manifest = document.documentElement.dataset.catalog;
  const response = await fetch(manifest || '../library/catalog.json');
  const assetURL = path => new URL(path, response.url).href;
  if (!response.ok) throw Error('Catalog request failed');
  const { clips } = await response.json();
  const refresh = () => {
    catalog.replaceChildren();
    for (const clip of clips.filter(c => kind.value === 'all' || c.kind === kind.value)) {
      const li = document.createElement('li');
      const label = document.createElement('span');
      const title = {
        verb: LABELS[clip.action],
        idle: '待机',
        mood: '',
        prop: clip.variant ? catalogLabels.server[clip.variant] : catalogLabels.prop[clip.prop],
        bubble: catalogLabels.bubble[clip.style],
        effect: catalogLabels.effect[clip.effect],
      }[clip.kind];
      label.textContent = [
        title ?? clip.id,
        clip.mood && clip.mood !== 'neutral' || ['idle','mood'].includes(clip.kind) ? MOOD_LABELS[clip.mood] : '',
        clip.side && /-[LR]$/.test(clip.id) ? (clip.side < 0 ? '左' : '右') : '',
      ].filter(Boolean).join(' · ');
      const link = document.createElement('a');
      const frame = String(clip.keyFrame).padStart(5, '0');
      link.href = manifest ? assetURL(clip.download) : `../out/library/${clip.id}/frames/${frame}.png`;
      link.download = clip.id + '.png';
      link.textContent = clip.frames === 1 ? '下载 PNG' : '下载关键帧';
      li.append(label, link);
      if (manifest) {
        for (const [field, text] of [
          ['download2x', '下载 2× PNG'], ['webm', '下载 WebM'], ['mov', '下载 MOV'], ['sequence', '下载 PNG 序列'],
        ]) {
          if (!clip[field]) continue;
          const asset = document.createElement('a');
          asset.href = assetURL(clip[field]);
          asset.download = clip.id + (field === 'download2x' ? '@2x.png' : field === 'sequence' ? '-frames.zip' : '.' + field);
          asset.textContent = text;
          li.append(asset);
        }
      } else if (clip.frames > 1) {
        const sequence = document.createElement('a');
        sequence.href = '../out/library/' + clip.id + '/frames/';
        sequence.textContent = '下载 PNG 序列';
        let downloading = false;
        sequence.addEventListener('click', async event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          if (downloading) return;
          downloading = true;
          try {
            const { downloadSequence } = await import('./download.js');
            await downloadSequence(clip, (done, total) => { sequence.textContent = `下载中 ${done}/${total}`; });
            sequence.textContent = '下载 PNG 序列';
          } catch {
            sequence.textContent = '下载失败 · 重试';
          } finally {
            downloading = false;
          }
        });
        li.append(sequence);
      }
      catalog.append(li);
    }
  };
  kind.addEventListener('change', refresh);
  refresh();
} catch {
  catalog.textContent = '素材库暂时无法加载。';
}
requestAnimationFrame(draw);
