import { defineTechnology } from '$core/define';

// ISDN PRI (the 1990s): the phone company hands the ISP's calls over on one E1 line, 30 calls at a time, each in its
// own 64 kbit/s timeslot. Your call is one of them, still carrying the modems' PPP as sound.
export default defineTechnology({
  look: 'cable',
  colour: '#b4566e',
  stack: ['ppp'],
  dive: 'tdm-frames',
  // your call's own timeslot: 64 kbit/s (the modem inside it still manages only 28.8k)
  rate: { down: 64e3, up: 64e3 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Primary_Rate_Interface', title: 'Primary Rate Interface', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Prim%C3%A4rmultiplexanschluss', title: 'Primärmultiplexanschluss', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Network_access_server', title: 'Network access server', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Network_Access_Server', title: 'Network Access Server', level: 'nerd', lang: 'de' },
  ],
});
