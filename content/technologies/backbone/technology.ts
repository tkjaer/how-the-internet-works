import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'trunk',
  colour: '#9a6b45',
  stack: ['ethernet', 'mpls'],
  dive: 'fibre-light',
  // a 100 Gbit/s wavelength
  // Today's, on 2010's routes too: a link's rate is only shown as its route's slowest (how long it takes), which
  // this never is behind a DSL line, 3G or a modem (the era tests read that rate, src/test/era-walk.ts).
  rate: { down: 100e9, up: 100e9 },
});
