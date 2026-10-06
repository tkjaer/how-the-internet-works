import { definePlace } from '$core/define';

// On the go: the phone on 5G out on the street, a cell tower up the road, and the mobile operator's core network.
export default definePlace({
  order: 2,
  // its picture in "Where are you?": a phone on the move
  picture: 'on-the-go',
  era: 'today',
  hops: [
    { at: 'phone', addr: '100.64.12.7' },
    { link: 'nr', km: 0.3 },
    { at: 'cell-tower', addr: '10.20.0.5' },
    // the tower tunnels your packets (GTP-U) to the mobile core over fibre
    { link: 'metro-fibre', stack: ['ethernet', 'gtp'], km: 12 },
    // carrier-grade NAT: thousands of phones share one outside address, so it hands out ports too
    { at: 'mobile-core', in: 'internet', addr: '10.20.0.1', natTo: '192.0.2.44:20517', owner: 'isp' },
    { link: 'backbone', km: 25 },
  ],
  layout: {
    // spread out so the badges and names keep apart at the size a small screen draws them (src/model/overlap.test.ts):
    // the shops huddle down the road on the left, the tower names itself below so the fibre's name fits above
    overview: {
      landscape: {
        nodes: { phone: [530, 610, 200], 'cell-tower': [980, 440, 240], internet: [1510, 290, 250] },
        links: {
          'phone-cell-tower': { bend: -0.2, label: [0, -70] },
          'cell-tower-internet': { bend: 0.15, label: [-77, -82] },
        },
      },
      portrait: {
        nodes: { phone: [240, 1335, 240], 'cell-tower': [740, 900, 240] },
        links: {
          'phone-cell-tower': { curve: [[240, 1215], [330, 960], [630, 930]], label: [110, 40] },
          'cell-tower-internet': { curve: [[745, 785], [880, 600], [750, 370]], label: [-66, 15, 'end'] },
        },
      },
    },
    internet: {
      landscape: { nodes: { 'cell-tower': [110, 680, 140], 'mobile-core': [460, 460, 180, 'above'] } },
      portrait: { nodes: { 'cell-tower': [200, 1440, 150], 'mobile-core': [740, 1170, 180] }, links: { 'mobile-core-core': { bend: 0.15 } }, owners: { isp: [270, 1090] } },
    },
  },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'de' },
  ],
});
