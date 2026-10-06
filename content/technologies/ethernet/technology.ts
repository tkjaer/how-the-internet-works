import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'cable',
  colour: '#e78d44',
  stack: ['ethernet'],
  dive: 'copper-pulses',
  // gigabit Ethernet
  rate: { down: 1e9, up: 1e9 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Ethernet', title: 'Ethernet', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Ethernet', title: 'Ethernet', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Ethernet', title: 'Ethernet', level: 'both', lang: 'de' },
  ],
});
