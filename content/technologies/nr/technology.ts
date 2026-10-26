import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'radio',
  colour: '#bd6b87',
  stack: ['nr'],
  dive: 'nr-radio',
  // a phone on mid-band 5G, in practice
  rate: { down: 300e6, up: 50e6 },
});
