import { defineLayer } from '$core/define';

export default defineLayer({
  tunnel: true,
  code: { ethertype: '0x0800 (IPv4)' },
  fields: [
    // the outer IPv4 header: from one end of the tunnel to the other
    { id: 'ovhl', bits: 8, value: '0x45' },
    { id: 'otos', bits: 8, value: '0' },
    { id: 'olen', bits: 16, value: '{len}' },
    { id: 'oid', bits: 16, value: '0' },
    { id: 'ofrag', bits: 16, value: '010 (DF)' },
    { id: 'ottl', bits: 8, value: '64' },
    { id: 'oproto', bits: 8, value: '17 (UDP)' },
    { id: 'osum', bits: 16, value: '{sum}' },
    { id: 'osrc', bits: 32, value: '{tunnel.src}', use: true, kid: true },
    { id: 'odst', bits: 32, value: '{tunnel.dst}', use: true, kid: true },
    // UDP
    { id: 'usport', bits: 16, value: '2152' },
    { id: 'udport', bits: 16, value: '2152 (GTP-U)', use: true },
    { id: 'ulen', bits: 16, value: '{payload+24}' },
    { id: 'usum', bits: 16, value: '0' },
    // GTP-U: the TEID says which phone's session this is
    // the optional words are words, so a 3G tunnel (2010) can say it has none (its era block)
    { id: 'flags', bits: 8, value: '@flags' },
    { id: 'type', bits: 8, value: '255 (G-PDU)' },
    { id: 'length', bits: 16, value: '{payload+8}' },
    { id: 'teid', bits: 32, value: { up: '0x1f3a92c4', down: '0x0000a17e' }, use: true, kid: true },
    { id: 'seqext', bits: 32, value: '@seqext' },
    { id: 'pdu', bits: 32, value: { up: '@pdu.up', down: '@pdu.down' }, use: true },
  ],
  dive: 'gtp-tunnel',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Cellular_network', title: 'Cellular network', level: 'kid', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/Mobiltelefoni', title: 'Mobiltelefoni', level: 'kid', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/Mobilfunknetz', title: 'Mobilfunknetz', level: 'kid', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/GPRS_Tunnelling_Protocol', title: 'GPRS Tunnelling Protocol', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/GPRS_Tunneling_Protocol', title: 'GPRS Tunneling Protocol', level: 'nerd', lang: 'de' },
  ],
});
