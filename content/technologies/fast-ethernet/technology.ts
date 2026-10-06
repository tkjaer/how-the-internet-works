import { defineTechnology } from '$core/define';

// Fast Ethernet (100BASE-TX, 1995): a 2010 home's cable to the DSL router, whose LAN ports were 100 Mbit/s. Two of
// the four pairs, one each way, MLT-3 at 125 MBd (the copper dive draws it from the rate). Today's homes and 2010's
// servers are on gigabit (`ethernet`).
export default defineTechnology({
  look: 'cable',
  // the same cable as gigabit's, so the time machine's morph between them is seamless
  colour: '#e78d44',
  stack: ['ethernet'],
  dive: 'copper-pulses',
  // the router's port speed: the laptop's gigabit port links at 100 Mbit/s to it
  rate: { down: 100e6, up: 100e6 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Fast_Ethernet', title: 'Fast Ethernet', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Ethernet', title: 'Ethernet', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Fast_Ethernet', title: 'Fast Ethernet', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/MLT-3_encoding', title: 'MLT-3 encoding', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/MLT-3-Code', title: 'MLT-3-Code', level: 'nerd', lang: 'de' },
  ],
});
