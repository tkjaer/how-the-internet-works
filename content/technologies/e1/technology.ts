import { defineTechnology } from '$core/define';

// A leased E1 (the 1990s): a 2 Mbit/s line rented from the phone company, always on, between two routers. Its 32
// timeslots are bundled into one pipe (slot 0 keeps the frames in step), carrying Cisco HDLC frames.
export default defineTechnology({
  look: 'cable',
  colour: '#c08a2e',
  stack: ['hdlc'],
  dive: 'tdm-frames',
  // 31 of the 32 timeslots of 64 kbit/s
  rate: { down: 1.984e6, up: 1.984e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/E-carrier', title: 'E-carrier', level: 'nerd', lang: 'en' },
    { url: 'https://en.wikipedia.org/wiki/Leased_line', title: 'Leased line', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Standleitung', title: 'Standleitung', level: 'both', lang: 'de' },
  ],
});
