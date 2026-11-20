import { register, emit, ground, flight } from './common.js';

// 0.18 s crouch, arms up in flight, landing squash and settle.
register('jump', {
  duration: 1.38,
  fx: emit('dust',0.73,ground),
  apply(c) {
    const { a } = c;
    return flight(c, a.height ?? 154);
  },
});
