import { defineLayer } from '$core/define';

export default defineLayer({
  fields: [
    { id: 'fc', bits: 16, value: { up: '0x8841 (QoS data, to DS, protected)', down: '0x8842 (QoS data, from DS, protected)' }, use: true },
    { id: 'duration', bits: 16, value: '44 µs' },
    // radio receiver and transmitter; the third address is the far end (the router) the AP bridges to or from
    { id: 'addr1', bits: 48, value: '{mac.rx}', use: true, kid: true },
    { id: 'addr2', bits: 48, value: '{mac.tx}', use: true, kid: true },
    { id: 'addr3', bits: 48, value: { up: '{mac.dst}', down: '{mac.src}' }, use: true },
    { id: 'seq', bits: 16, value: { up: '0x0a30', down: '0x7c10' } },
    { id: 'qos', bits: 16, value: { up: '0 (best effort)', down: '5 (video)' } },
    { id: 'ccmp', bits: 64, value: { up: 'PN 41302', down: 'PN 99871' }, use: true },
    { id: 'snap', bits: 64, value: 'AA-AA-03 · {inner.ethertype}', use: true },
    { id: 'fcs', bits: 32, value: '{crc}', use: true },
  ],
  dive: 'wifi-frame',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/IEEE_802.11', title: 'IEEE 802.11', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/IEEE_802.11', title: 'IEEE 802.11', level: 'nerd', lang: 'de' },
  ],
});
