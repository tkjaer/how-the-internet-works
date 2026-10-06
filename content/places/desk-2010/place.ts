import { definePlace } from '$core/define';
import desk from '../desk/place';

// At home, at the desk, around 2010: the same laptop on a cable, but the router is a DSL modem-router on the phone
// line, as on Wi-Fi in 2010 (home-dsl): tones down the copper pair to a DSLAM in the street cabinet, then fibre. Its
// LAN ports are 100 Mbit/s, so the cable is Fast Ethernet. The time machine goes between it and the desk today, which
// also start on a cable (`eraStops`).
export default definePlace({
  variantOf: 'home',
  order: 1.5,
  era: '2010',
  hops: [
    { at: 'laptop', addr: '192.168.1.40' },
    { link: 'fast-ethernet', km: 0.003 },
    { at: 'router', node: 'dsl-router', addr: '192.168.1.1', natTo: '203.0.113.7:61757' },
    { link: 'vdsl', km: 0.4 },
    { at: 'cabinet', node: 'dslam', in: 'internet', owner: 'isp' },
    { link: 'metro-fibre', stack: ['ethernet', 'vlan'], km: 6 },
    { at: 'backhaul', in: 'internet', owner: 'isp' },
    { link: 'metro-fibre', stack: ['ethernet', 'vlan'], km: 18 },
    { at: 'bng', in: 'internet', owner: 'isp' },
    { link: 'backbone', km: 25 },
  ],
  entry: { internet: 'home' },
  // laid out as at the desk today (the same room, the same spots), so the trip in time only swaps the router and the
  // cabinet's box
  layout: desk.layout,
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Digital_subscriber_line', title: 'DSL', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/DSL', title: 'DSL', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Digital_Subscriber_Line', title: 'Digital Subscriber Line', level: 'both', lang: 'de' },
  ],
});
