import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'fibre',
  colour: '#3aaea1',
  stack: ['ethernet'],
  dive: 'fibre-light',
  // 10 Gbit/s
  rate: { down: 10e9, up: 10e9 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Metro_Ethernet', title: 'Metro Ethernet', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Metro_Ethernet', title: 'Metro Ethernet', level: 'nerd', lang: 'de' },
  ],
});
