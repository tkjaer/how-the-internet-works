import { defineTechnology } from '$core/define';

// GSM data in 1995 (circuit-switched data, CSD): the laptop's GSM phone dials the internet company like a modem. The
// call gets one time slot of eight on a 200 kHz carrier, its own for the whole call, carrying 9.6 kbit/s of the
// laptop's PPP inside the radio link protocol (RLP) to the mobile switch's modems.
export default defineTechnology({
  look: 'radio',
  colour: '#4f9a7a',
  stack: ['ppp'],
  dive: 'nr-radio',
  // TCH/F9.6: 9,600 bit/s each way
  rate: { down: 9600, up: 9600 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Circuit_Switched_Data', title: 'Circuit Switched Data', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/GSM', title: 'GSM', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Circuit_Switched_Data', title: 'Circuit Switched Data', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/GSM', title: 'GSM', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Global_System_for_Mobile_Communications', title: 'Global System for Mobile Communications', level: 'nerd', lang: 'de' },
  ],
});
