import { defineLayer } from '$core/define';

// Cisco HDLC, the frame on a 1990s leased line between two routers (a Cisco serial port's default): a flag, an address,
// the type of what's inside (the same numbers as Ethernet's) and a check. Each router opens it and writes a new one.
export default defineLayer({
  fields: [
    { id: 'flag', bits: 8, value: '0x7E' },
    { id: 'address', bits: 8, value: '0x0F' },
    { id: 'control', bits: 8, value: '0x00' },
    { id: 'proto', bits: 16, value: '{inner.ethertype}', use: ['router', 'endpoint'], simple: '@ip' },
    { id: 'fcs', bits: 16, value: '{crc}', use: ['router', 'endpoint'] },
  ],
  openAt: ['endpoint', 'router'],
  dive: 'ppp-hello',
});
