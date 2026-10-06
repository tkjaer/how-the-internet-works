import { defineTechnology } from '$core/define';

// The backbone where it crosses the sea (issue #39): the same MPLS trunk, in a cable on the sea floor between two landing
// stations, with repeaters powered through the cable. Its own technology, so it is its own stretch (and dive mode).
export default defineTechnology({
  look: 'trunk',
  colour: '#2a7f9e',
  stack: ['ethernet', 'mpls'],
  dive: 'fibre-light',
  // the ISP's 100 Gbit/s wavelength (the cable carries hundreds of Tbit/s)
  // Today's, on 2010's routes too: a link's rate is only shown as its route's slowest (how long it takes), which
  // this never is behind a DSL line, 3G or a modem (the era tests read that rate, src/test/era-walk.ts).
  rate: { down: 100e9, up: 100e9 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Submarine_communications_cable', title: 'Submarine communications cable', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/S%C3%B8kabel', title: 'Søkabel', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Seekabel', title: 'Seekabel', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Cable_landing_point', title: 'Cable landing point', level: 'nerd', lang: 'en' },
  ],
});
