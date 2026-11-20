import { effect, glyph } from './cel.js';

effect('exclaim', 0.67, (ctx, u, e, t) => {
  glyph(ctx,'！',18,-12-24*u);
});
