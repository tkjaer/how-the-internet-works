import { definePlace } from '$core/define';

// At home: the phone on Wi-Fi, a cable to the home router, and fibre to the home (FTTH) up the street.
export default definePlace({
  order: 1,
  // its picture in "Where are you?": the house
  picture: 'home',
  era: 'today',
  hops: [
    { at: 'phone', addr: '192.168.1.23' },
    { link: 'wifi', km: 0.005 },
    { at: 'ap' },
    { link: 'ethernet', km: 0.005 },
    { at: 'router', addr: '192.168.1.1', natTo: '203.0.113.7:61757' },
    { link: 'gpon', km: 1.2 },
    // the splitter in the street is passive; the PON runs on to the OLT at the exchange
    { at: 'cabinet', in: 'internet', owner: 'isp' },
    { link: 'gpon', km: 6 },
    { at: 'olt', in: 'internet', owner: 'isp' },
    { link: 'metro-fibre', stack: ['ethernet', 'vlan'], km: 18 },
    { at: 'bng', in: 'internet', owner: 'isp' },
    { link: 'backbone', km: 25 },
  ],
  // inside the internet, the whole house stands for "where you came from"
  entry: { internet: 'home' },
  layout: {
    overview: {
      landscape: {
        // everything indoors: the Wi-Fi box on the wall, so the radio hop crosses the room and not the roof
        nodes: { phone: [225, 590, 210], ap: [655, 540, 180, 'above'], router: [1015, 618, 190] },
        links: {
          'phone-ap': { bend: -0.15, label: [0, 90] },
          'ap-router': { bend: 0.18, label: [-30, 95, 'end'] },
          'router-internet': { curve: [[1090, 590], [1250, 595], [1290, 430]], label: [10, 70, 'start'] },
        },
        // the era's prop: a shelf on the wall, between the Wi-Fi box and the router
        props: { shelf: [820, 515, 110, 80] },
      },
      portrait: {
        // the Wi-Fi box and the phone downstairs, the router up in the attic, the fibre out through the roof
        nodes: { phone: [220, 1400, 210], ap: [650, 1150, 170], router: [464, 885, 180, 'above'] },
        links: {
          'phone-ap': { bend: -0.3, label: [5, -50] },
          'ap-router': { bend: 0.2, label: [-50, 40, 'end'] },
          'router-internet': { curve: [[550, 880], [740, 700], [610, 480]], label: [100, -60] },
        },
        props: { shelf: [690, 1440, 100, 90] },
      },
    },
    internet: {
      // the house a little higher than the OLT, so their names (at their biggest, in short landscape) don't meet; in
      // 2010 the backhaul switch stands about where the OLT is today
      landscape: { nodes: { home: [140, 620, 120], cabinet: [300, 440, 150, 'above'], olt: [430, 710, 150], backhaul: [440, 680, 150], bng: [660, 450, 150, 'above'] }, links: { 'bng-core': { bend: -0.2 } } },
      portrait: { nodes: { home: [200, 1470, 130], cabinet: [640, 1330, 150], olt: [240, 1180, 150], backhaul: [240, 1180, 150], bng: [720, 1030, 150] } },
    },
  },
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Fiber_to_the_x', title: 'Fibre to the home', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/FTTx', title: 'FTTx', level: 'nerd', lang: 'de' },
  ],
});
