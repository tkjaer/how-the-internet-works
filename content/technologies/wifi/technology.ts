import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'radio',
  colour: '#72b8a5',
  stack: ['wifi'],
  dive: 'wifi-radio',
  // Wi‑Fi 6 to a phone near the box, in practice
  rate: { down: 500e6, up: 500e6 },
});
