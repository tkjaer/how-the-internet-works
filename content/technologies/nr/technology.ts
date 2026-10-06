import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'radio',
  colour: '#bd6b87',
  stack: ['nr'],
  dive: 'nr-radio',
  // a phone on mid-band 5G, in practice
  rate: { down: 300e6, up: 50e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Beamforming', title: 'Beamforming', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Beamforming', title: 'Beamforming', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Orthogonal_frequency-division_multiple_access', title: 'OFDMA', level: 'nerd', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/5G_NR', title: '5G NR', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/5G_NR', title: '5G NR', level: 'nerd', lang: 'de' },
  ],
});
