import { defineTechnology } from '$core/define';

// Across the Atlantic in 1995: CANTAT-3 (1994), one colour of 2.5 Gbit/s SDH on each fibre pair, cut into circuits
// for phone calls and leased lines. The upstream rents a couple of 2 Mbit/s circuits in it, carrying Cisco HDLC.
export default defineTechnology({
  look: 'trunk',
  colour: '#2a7f9e',
  stack: ['hdlc'],
  dive: 'fibre-light',
  // the upstream's two E1 circuits inside the cable's 3 × 2.5 Gbit/s
  rate: { down: 3.968e6, up: 3.968e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/CANTAT-3', title: 'CANTAT-3', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/CANTAT', title: 'CANTAT', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Synchronous_optical_networking', title: 'SONET/SDH', level: 'nerd', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/S%C3%B8kabel', title: 'Søkabel', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Synchronous_Optical_Network', title: 'Synchronous Optical Network', level: 'nerd', lang: 'de' },
  ],
});
