import { defineNode } from '$core/define';

// The switch in the basement of a block of flats: copper up to every flat, one fibre out to the ISP.
export default defineNode({
  kind: 'device',
  role: 'bridge',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Fiber_to_the_x', title: 'Fibre to the building', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/FTTx', title: 'FTTx', level: 'nerd', lang: 'de' },
  ],
});
