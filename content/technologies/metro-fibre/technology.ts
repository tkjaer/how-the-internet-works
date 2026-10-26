import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'fibre',
  colour: '#3aaea1',
  stack: ['ethernet'],
  dive: 'fibre-light',
  // 10 Gbit/s
  rate: { down: 10e9, up: 10e9 },
});
