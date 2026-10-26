import { defineLayer } from '$core/define';

export default defineLayer({
  code: { ethertype: '0x0800 (IPv4)', ppp: '0x0021 (IPv4)' },
  fields: [
    { id: 'version', bits: 4, value: '4' },
    { id: 'ihl', bits: 4, value: '5 (20 bytes)' },
    { id: 'dscp', bits: 6, value: '0 (best effort)' },
    { id: 'ecn', bits: 2, value: '0' },
    { id: 'length', bits: 16, value: '{len}' },
    { id: 'id', bits: 16, value: { up: '0x1c46', down: '0x8e21' } },
    { id: 'flags', bits: 3, value: '010 (DF)' },
    { id: 'frag', bits: 13, value: '0' },
    // every router takes one off; at 0 the packet is dropped (no loops forever)
    { id: 'ttl', bits: 8, value: '{ttl}', use: ['router', 'nat'], simple: true },
    // routers hash src, dst, protocol and the two ports (the 5-tuple) to pick one of several equal paths (ECMP)
    { id: 'proto', bits: 8, value: '{inner.ipproto}', use: ['router', 'nat', 'endpoint'] },
    { id: 'checksum', bits: 16, value: '{sum}', use: ['router', 'nat', 'endpoint'] },
    { id: 'src', bits: 32, value: '{src}', use: ['router', 'nat', 'endpoint'], simple: true },
    { id: 'dst', bits: 32, value: '{dst}', use: ['router', 'nat', 'endpoint'], simple: true },
  ],
  dive: 'ip-post',
});
