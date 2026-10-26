import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'cable',
  colour: '#e78d44',
  stack: ['ethernet'],
  dive: 'copper-pulses',
  // gigabit Ethernet
  rate: { down: 1e9, up: 1e9 },
});
