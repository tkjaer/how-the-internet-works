import { defineNode } from '$core/define';

// A laptop of the mid-1990s with a GSM phone on a cable to the data card in its side (a PC card, like Nokia's
// Cellular Data Card on a Nokia 2110): the laptop dials out through the phone at 9.6 kbit/s.
export default defineNode({
  kind: 'device',
  role: 'endpoint',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Circuit_Switched_Data', title: 'Circuit Switched Data', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Circuit_Switched_Data', title: 'Circuit Switched Data', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/PC_Card', title: 'PC Card', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/PC_Card', title: 'PC Card', level: 'nerd', lang: 'de' },
  ],
});
