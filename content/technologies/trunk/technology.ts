import { defineTechnology } from '$core/define';

// A trunk between two phone companies' switches in the 1990s: an E1 of 30 calls, each in its own 64 kbit/s timeslot,
// set up and torn down by SS7 messages in slot 16. Here it carries the mobile switch's modem call to the exchange.
export default defineTechnology({
  look: 'cable',
  colour: '#a8574a',
  stack: ['ppp'],
  dive: 'tdm-frames',
  // your call's own timeslot (the modem inside it manages 9.6k)
  rate: { down: 64e3, up: 64e3 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Trunking', title: 'Trunking', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/B%C3%BCndelung_(Daten%C3%BCbertragung)', title: 'Bündelung (Datenübertragung)', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Signalling_System_No._7', title: 'Signalling System No. 7', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Signalling_System_7', title: 'Signalling System 7', level: 'nerd', lang: 'de' },
  ],
});
