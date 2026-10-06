import { defineLayer } from '$core/define';

// PPP in HDLC-like framing (RFC 1662) on a dial-up call: the PC's PPP software and the ISP's access server build and
// read it (the modems only turn its bytes into sound); the telephone exchange in between just carries the sound.
export default defineLayer({
  fields: [
    { id: 'flag', bits: 8, value: '0x7E' },
    { id: 'address', bits: 8, value: '0xFF' },
    { id: 'control', bits: 8, value: '0x03' },
    { id: 'proto', bits: 16, value: '{inner.ppp}', use: ['router', 'endpoint'], kid: '@ip' },
    // the default 16-bit frame check (RFC 1662); 32 bits only if LCP negotiates it (RFC 1570)
    { id: 'fcs', bits: 16, value: '{crc}', use: ['router', 'endpoint'] },
  ],
  openAt: ['endpoint', 'router'],
  dive: 'ppp-hello',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Point-to-Point_Protocol', title: 'Point-to-Point Protocol', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Point-to-Point_Protocol', title: 'Point-to-Point Protocol', level: 'nerd', lang: 'de' },
  ],
});
