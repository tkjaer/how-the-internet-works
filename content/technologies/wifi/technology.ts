import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'radio',
  colour: '#72b8a5',
  stack: ['wifi'],
  dive: 'wifi-radio',
  // Wi‑Fi 6 to a phone near the box, in practice
  rate: { down: 500e6, up: 500e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Wi-Fi', title: 'Wi-Fi', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Wi-Fi', title: 'Wi-Fi', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Wi-Fi', title: 'Wi-Fi', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Orthogonal_frequency-division_multiplexing', title: 'OFDM', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Orthogonales_Frequenzmultiplexverfahren', title: 'Orthogonales Frequenzmultiplexverfahren', level: 'nerd', lang: 'de' },
  ],
});
