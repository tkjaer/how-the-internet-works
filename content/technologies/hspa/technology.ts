import { defineTechnology } from '$core/define';

// 3G radio as phones had it in 2010: WCDMA on a 5 MHz carrier, with HSPA (HSDPA down, HSUPA up) for data. The
// phone shares the cell's spreading codes with every other phone, a 2 ms slot at a time.
export default defineTechnology({
  look: 'radio',
  colour: '#6f9a4a',
  stack: ['hspa'],
  dive: 'nr-radio',
  // what a 2010 phone got in practice (HSDPA's peak, 7.2–14 Mbit/s, was the whole cell's)
  rate: { down: 2e6, up: 1e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/3G', title: '3G', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/3G', title: '3G', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/High_Speed_Packet_Access', title: 'High Speed Packet Access', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/High_Speed_Packet_Access', title: 'High Speed Packet Access', level: 'nerd', lang: 'de' },
  ],
});
