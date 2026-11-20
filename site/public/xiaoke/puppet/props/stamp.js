import { SKIN, WEB } from '../palette.js';
import { prop, box, disk, label } from './cel.js';

export const draw = prop((ctx, o) => {
  disk(ctx,WEB.ochre,0,-17,13);
  box(ctx,SKIN.under,-8,-17,16,28);
  box(ctx,WEB.cinnabar,-25,7,50,15);
  label(ctx,'章',0,19,20,12);
});
