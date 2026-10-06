import { defineLayer } from '$core/define';

export default defineLayer({
  code: { ipproto: '6 (TCP)' },
  fields: [
    // a NAT rewrites the source port (or the destination port on the way back); routers hash both (ECMP)
    { id: 'sport', bits: 16, value: '{sport}', use: ['router', 'nat', 'endpoint'] },
    { id: 'dport', bits: 16, value: '{dport}', use: ['router', 'nat', 'endpoint'] },
    { id: 'seq', bits: 32, value: { up: '3920417111', down: '1120598433' }, use: ['endpoint'], kid: { up: '1', down: '42' } },
    // the server acknowledges the whole request: its seq plus the bytes it carried
    { id: 'ack', bits: 32, value: { up: '1120598433', down: '{ack}' }, use: ['endpoint'] },
    { id: 'offset', bits: 4, value: '5 (20 bytes)' },
    // RFC 9293: 4 reserved bits and 8 control bits (the old NS bit is historic, RFC 8311); RFC 793's were 6 and 6,
    // until ECN took two reserved bits for CWR and ECE (RFC 3168, 2001)
    { id: 'reserved', bits: 4, bitsIn: { 1995: 6 }, value: '0' },
    { id: 'flags', bits: 8, bitsIn: { 1995: 6 }, value: { up: 'PSH, ACK', down: 'ACK' }, use: ['endpoint'] },
    { id: 'window', bits: 16, value: { up: '2048', down: '501' }, use: ['endpoint'] },
    // covers the addresses and ports too, so a NAT has to fix it
    { id: 'checksum', bits: 16, value: '{sum}', use: ['nat', 'endpoint'] },
    { id: 'urgent', bits: 16, value: '0' },
  ],
  openAt: ['endpoint'],
  dive: 'tcp-pieces',
  learnMore: [
    { url: 'https://simple.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'TCP (Simple English)', level: 'kid', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'Transmission Control Protocol', level: 'both', lang: 'da' },
    { url: 'https://en.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'TCP', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Transmission_Control_Protocol', title: 'Transmission Control Protocol', level: 'nerd', lang: 'de' },
  ],
});
