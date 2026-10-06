import { defineTechnology } from '$core/define';

// Fibre to the building: one strand of its own from the ISP to a switch in the basement of a block of flats, light
// going both ways on it (a BiDi optic: one colour up, another down). Ordinary cable runs on up to each flat.
export default defineTechnology({
  look: 'fibre',
  colour: '#3a8fc0',
  stack: ['ethernet'],
  dive: 'fibre-light',
  // a 1 Gbit/s BiDi optic
  rate: { down: 1e9, up: 1e9 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Fiber_to_the_x', title: 'Fibre to the building', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Fiber_to_the_x', title: 'Fiber til bygningen', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/FTTx', title: 'FTTx', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Bidirectional_optical_transceiver', title: 'BiDi optics', level: 'nerd', lang: 'en' },
  ],
});
