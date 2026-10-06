import { defineLayer } from '$core/define';

export default defineLayer({
  dive: 'sticker-doors',
  code: { ethertype: '0x8847 (MPLS)' },
  // a core router swaps the label and counts down its TTL; the IP packet inside isn't read until the label comes off
  switched: true,
  fields: [
    { id: 'label', bits: 20, value: '{label}', use: true, kid: true },
    { id: 'tc', bits: 3, value: '0' },
    { id: 's', bits: 1, value: '1 (bottom of stack)' },
    { id: 'ttl', bits: 8, value: '{ttl}', use: true },
  ],
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Multiprotocol_Label_Switching', title: 'MPLS', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Multiprotocol_Label_Switching', title: 'Multiprotocol Label Switching', level: 'nerd', lang: 'de' },
  ],
});
