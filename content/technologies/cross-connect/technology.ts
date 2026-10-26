import { defineTechnology } from '$core/define';

// A short fibre between two networks' boxes in the same building (an exchange's data centre): the cable that joins them
export default defineTechnology({
  look: 'fibre',
  colour: '#d39b1e',
  stack: ['ethernet'],
  dive: 'fibre-light',
  // 100 Gbit/s ports
  // Today's, on 2010's routes too: a link's rate is only shown as its route's slowest (how long it takes), which
  // this never is behind a DSL line, 3G or a modem (the era tests read that rate, src/test/era-walk.ts).
  rate: { down: 100e9, up: 100e9 },
});
