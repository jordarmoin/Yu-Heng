import { effect, glyph } from './cel.js';

effect('question', 0.95, (ctx, u, e, t) => {
  glyph(ctx,'？',18,-12-18*u);
});
