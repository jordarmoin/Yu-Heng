import { WEB } from '../puppet/palette.js';

export const COPY = {
  say: '我来带路。',
  explain: '我一点点讲。',
  whisper: '我悄悄告诉你。',
  list: '我来看看\n我再试试',
  card: '我准备好了。', cardSub: '我来带路。',
  nervous: '我再试一次。',
  shout: '我做到了！',
  batAway: '我先收起来。',
};

export const LABELS = {
  idle:'待机', feel:'变换心情', lookAt:'看过去', say:'说句话', wave:'挥手',
  popUp:'探身', ducks:'缩回去', peek:'偷看', inkOut:'化作墨点', inkIn:'墨点现身', dropIn:'从天而降', slideIn:'走入', jetIn:'喷射入场',
  walkTo:'走过去', runTo:'跑过去', hop:'蹦一下', jump:'跳高', tiptoe:'踮脚走', float:'漂浮', climb:'攀爬', slideDown:'滑下',
  pointAt:'指一指', present:'展示', holdUp:'举起来', circle:'画圈', underline:'划线', count:'数手臂', magnify:'放大看',
  nod:'点头', shake:'摇头', shrug:'耸肩', think:'想一想', listen:'听一听', explain:'讲一讲',
  tap:'点一下', doubleTap:'点两下', longPress:'长按', drag:'拖动', type:'打字', scroll:'滚动', hover:'悬停', pull:'拉杆',
  celebrate:'庆祝', cheer:'欢呼', oops:'糟糕', sigh:'叹气', yawn:'打哈欠', stretch:'伸懒腰', sleep:'睡觉', wakeUp:'醒来',
  giggle:'偷笑', facepalm:'捂脸', armsMind:'手臂走神', camouflage:'变色', squeeze:'钻过缝隙', cling:'吸住',
  multitask:'一心多用', juggle:'抛接', carry:'搬箱子', batAway:'挥走气泡',
};

// Polish (Claude): the playground groups actions by what they're for in a video, not alphabetically.
export const FAMILIES = [
  ['出场', ['slideIn','popUp','peek','ducks','dropIn','jetIn','inkIn','inkOut']],
  ['走动', ['walkTo','runTo','tiptoe','hop','jump','float','climb','slideDown','squeeze','cling']],
  ['讲解', ['wave','say','lookAt','pointAt','present','holdUp','circle','underline','count','magnify','explain','listen']],
  ['操作界面', ['tap','doubleTap','longPress','drag','scroll','hover','type','pull','carry','batAway']],
  ['心情戏', ['feel','nod','shake','shrug','think','celebrate','cheer','oops','sigh','giggle','facepalm','yawn','stretch','sleep','wakeUp']],
  ['章鱼绝技', ['camouflage','armsMind','multitask','juggle','idle']],
];

export const MOOD_LABELS = {
  neutral:'平静', happy:'开心', joy:'雀跃', curious:'好奇', proud:'得意', shy:'害羞', nervous:'紧张',
  determined:'坚定', angry:'生气', sad:'难过', shock:'震惊', sleepy:'困倦', dizzy:'眩晕', excited:'兴奋',
  thinking:'思考', confused:'困惑', relieved:'放心', embarrassed:'尴尬', bored:'无聊', focused:'专注',
};

export const DIRECTIONAL = new Set([
  'peek','popUp','slideIn','inkIn','dropIn','jetIn','walkTo','runTo','tiptoe','climb','slideDown',
  'pointAt','present','circle','underline','magnify','lookAt','listen','tap','doubleTap','longPress',
  'drag','scroll','hover','pull','squeeze','cling','carry','wave',
]);

export const LOOPS = new Set(['idle','explain','type','cheer','sleep','juggle','float','multitask']);

export function direct(ke, name, { side = 1, width = 1920, height = 1080, live = false } = {}) {
  const x = ke._x, y = ke.home.y, s = ke.s;
  const target = (dx = 153, dy = -23) => [Math.min(width - 18, Math.max(18, x + side * dx * s)), Math.min(height - 18, Math.max(18, y + dy * s))];
  const goal = Math.min(width - 120 * s, Math.max(120 * s, x + side * 155 * s));
  const bubble = { w: live ? Math.min(270, width - 48) : 350, hold: 0.73 };
  switch (name) {
    case 'idle': return ke.wait(3);
    case 'feel': return ke.feel('curious', { pop: false }).wait(0.8).feel('neutral', { pop: false }).wait(0.36);
    case 'say': return ke.say(COPY.say, bubble).wait(2);
    case 'explain': ke.say(COPY.explain, bubble); return ke.explain();
    case 'batAway': ke.say(COPY.batAway, { ...bubble, hold: 1.4 }).wait(0.7); return ke.batAway({ target: target(120,-88) });
    case 'lookAt': return ke.lookAt(target(), { wait: true });
    case 'walkTo': case 'runTo': case 'tiptoe': case 'jetIn': case 'inkIn': case 'dropIn': return ke[name](goal);
    case 'slideIn': return ke.slideIn({ side: -side, x: goal });
    case 'popUp': return ke.popUp({ from: side < 0 ? 'right' : 'left', x: goal });
    case 'climb': return ke.climb({ edge: target(119)[0], toY: y - 125*s });
    case 'slideDown': return ke.slideDown({ side, toY: y+39*s });
    case 'pointAt': case 'tap': case 'doubleTap': case 'longPress': case 'magnify': case 'hover': return ke[name](target());
    case 'cling': return ke.cling(target(117, -117));
    case 'pull': return ke.pull(target(154, 43));
    case 'circle': return ke.circle(target(), 26*s);
    case 'underline': return ke.underline(target(115, 44), target(185, 44));
    case 'drag': return ke.drag(target(141, -36), target(184, 48));
    case 'squeeze': return ke.squeeze({ gapX: (x + goal) / 2, x: goal, gapW: 100*s, side });
    case 'carry': return ke.carry({ prop: 'cardboard', side, x: goal });
    case 'count': return ke.count(8);
    case 'camouflage': return ke.camouflage(WEB.paper);
    case 'scroll': return ke.scroll({ side, dir: side < 0 ? 'up' : 'down' });
    default: return ke[name]({ side });
  }
}
