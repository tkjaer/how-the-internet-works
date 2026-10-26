import { defineTechnology } from '$core/define';

// The old copper phone line from the home to a DSLAM in the street cabinet, carrying Ethernet frames as DMT tones
// (VDSL2, PTM) above the band of a phone call.
export default defineTechnology({
  look: 'cable',
  colour: '#8d6cc4',
  stack: ['ethernet'],
  dive: 'dsl-tones',
  // a 20/2 Mbit/s line, a common plan in 2010 (most homes had ADSL2+ from the exchange, 8–24 Mbit/s; VDSL2 near a
  // cabinet was sold "best effort", 25–50)
  rate: { down: 20e6, up: 2e6 },
});
