import { defineLayer } from '$core/define';

// 3G's radio layers for data: RLC (in the RNC) numbers, resends and ciphers the pieces; MAC-hs (in the NodeB) queues
// them and sends them in the 2 ms slots the NodeB's scheduler picks (HSDPA).
export default defineLayer({
  fields: [
    { id: 'hrnti', bits: 16, value: '0x2317', use: true, kid: true },
    { id: 'queue', bits: 3, value: '1', use: true },
    { id: 'tsn', bits: 6, value: { up: '12', down: '37' }, use: true },
    { id: 'rlcsn', bits: 12, value: { up: '905', down: '2214' }, use: true },
  ],
  dive: 'nr-grant',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/3G', title: '3G', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/3G', title: '3G', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/High_Speed_Packet_Access', title: 'High Speed Packet Access', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/High_Speed_Packet_Access', title: 'High Speed Packet Access', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/Radio_Network_Controller', title: 'Radio Network Controller', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Radio_Network_Controller', title: 'Radio Network Controller', level: 'nerd', lang: 'de' },
  ],
});
