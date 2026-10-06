import { definePlace } from '$core/define';
import home from '../home/place';

// At home in a block of flats with fibre to the building (FTTB): the phone on Wi-Fi, a cable to the flat's router,
// a cable down the stairs to the ISP's switch in the basement, and from there a glass thread to the ISP.
export default definePlace({
  variantOf: 'home',
  order: 1.2,
  era: 'today',
  hops: [
    { at: 'phone', addr: '192.168.1.23' },
    { link: 'wifi', km: 0.005 },
    { at: 'ap' },
    { link: 'ethernet', km: 0.005 },
    { at: 'router', node: 'flat-router', addr: '192.168.1.1', natTo: '203.0.113.7:61757' },
    { link: 'ethernet', km: 0.03 },
    { at: 'basement', node: 'building-switch', in: 'internet', owner: 'isp' },
    { link: 'fttb', stack: ['ethernet', 'vlan'], km: 3 },
    { at: 'backhaul', in: 'internet', owner: 'isp' },
    { link: 'metro-fibre', stack: ['ethernet', 'vlan'], km: 18 },
    { at: 'bng', in: 'internet', owner: 'isp' },
    { link: 'backbone', km: 25 },
  ],
  // inside the internet, the block of flats stands for "where you came from"
  entry: { internet: 'flats' },
  layout: {
    // the flat is laid out like the house: the same room, the same spots
    ...home.layout,
    // the basement switch where the street cabinet is at home
    internet: {
      landscape: { nodes: { flats: [130, 600, 120], basement: [278, 440, 150, 'above'], backhaul: [490, 680, 150], bng: [660, 450, 150, 'above'] }, links: { 'bng-core': { bend: -0.15 } } },
      portrait: { nodes: { flats: [170, 1470, 130], basement: [710, 1400, 150], backhaul: [180, 1220, 150], bng: [720, 1060, 150] }, links: { 'bng-core': { bend: 0.08 }, 'basement-backhaul': { bend: 0.2 } } },
    },
  },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Fiber_to_the_x', title: 'Fibre to the building', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Fiber_to_the_x', title: 'Fiber til bygningen', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/FTTx', title: 'FTTx', level: 'both', lang: 'de' },
  ],
});
