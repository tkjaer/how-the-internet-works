import { defineTechnology } from '$core/define';

// The GSM network's lines in 1995: E1s from the mast to its base station controller (Abis) and on to the transcoder at
// the mobile switch (Ater). A call needs only a quarter of a 64 kbit/s timeslot here: 16 kbit/s, still carrying the
// GSM data call's RLP frames.
export default defineTechnology({
  look: 'cable',
  colour: '#8a6a9a',
  stack: ['ppp'],
  dive: 'tdm-frames',
  // your call's quarter-slot
  rate: { down: 16e3, up: 16e3 },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Base_station_subsystem', title: 'Base station subsystem', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Base_Station_Subsystem', title: 'Base Station Subsystem', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/E-carrier', title: 'E-carrier', level: 'nerd', lang: 'en' },
  ],
});
