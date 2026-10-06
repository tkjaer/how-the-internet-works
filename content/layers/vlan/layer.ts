import { defineLayer } from '$core/define';

export default defineLayer({
  dive: 'sticker-doors',
  code: { ethertype: '0x88A8 (802.1ad)' },
  fields: [
    { id: 'spcp', bits: 3, value: '0' },
    { id: 'sdei', bits: 1, value: '0' },
    // the outer tag names the street cabinet, the inner one the customer (the BNG's subscriber line)
    { id: 'svid', bits: 12, value: '101', use: true, kid: true },
    { id: 'ctpid', bits: 16, value: '0x8100' },
    { id: 'cpcp', bits: 3, value: '0' },
    { id: 'cdei', bits: 1, value: '0' },
    { id: 'cvid', bits: 12, value: '2042', use: ['router'], kid: true },
    { id: 'type', bits: 16, value: '{inner.ethertype}', use: ['router'] },
  ],
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/IEEE_802.1Q', title: 'IEEE 802.1Q', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/IEEE_802.1Q', title: 'IEEE 802.1Q', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/IEEE_802.1ad', title: 'IEEE 802.1ad (Q-in-Q)', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/IEEE_802.1ad', title: 'IEEE 802.1ad', level: 'nerd', lang: 'de' },
  ],
});
