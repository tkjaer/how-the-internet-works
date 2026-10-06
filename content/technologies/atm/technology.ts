import { defineTechnology } from '$core/define';

// An American backbone in 1995: routers joined across the country by ATM switches, on SONET fibre. The packet is cut
// into 53-byte cells, each with a label that every switch swaps (MPLS's ancestor).
export default defineTechnology({
  look: 'trunk',
  colour: '#7b6bb0',
  stack: ['atm'],
  dive: 'fibre-light',
  // an OC-3c: 155 Mbit/s of SONET (about 135 Mbit/s of packets, after the cells' labels)
  rate: { down: 155.52e6, up: 155.52e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Asynchronous_Transfer_Mode', title: 'Asynchronous Transfer Mode', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Asynchronous_Transfer_Mode', title: 'Asynchronous Transfer Mode', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Optical_Carrier_transmission_rates', title: 'Optical carrier (OC-3)', level: 'nerd', lang: 'en' },
  ],
});
