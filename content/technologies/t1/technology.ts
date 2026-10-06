import { defineTechnology } from '$core/define';

// A leased T1 (the 1990s, North America): 24 timeslots and a framing bit, 1.5 Mbit/s between two routers, carrying
// Cisco HDLC frames. In Europe the same line would be an E1.
export default defineTechnology({
  look: 'cable',
  colour: '#8f8a3a',
  stack: ['hdlc'],
  dive: 'tdm-frames',
  // 24 timeslots of 64 kbit/s
  rate: { down: 1.536e6, up: 1.536e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/T-carrier', title: 'T-carrier', level: 'nerd', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/Leased_line', title: 'Leased line', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Standleitung', title: 'Standleitung', level: 'both', lang: 'de' },
  ],
});
