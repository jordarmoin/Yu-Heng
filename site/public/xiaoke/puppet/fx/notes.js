import { effect, glyph } from './cel.js';

effect('notes', 1.15, (ctx, u, e, t) => {
  glyph(ctx,'♪',-20,-28*u);
  glyph(ctx,'♫',20,-40*u);
});
