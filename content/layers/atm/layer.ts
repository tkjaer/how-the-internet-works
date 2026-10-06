import { defineLayer } from '$core/define';

// ATM (the 1990s backbones): the packet is cut into cells of 48 bytes, each with a 5-byte label in front. The switches
// in the middle read only the label (VPI/VCI) and swap it for the next one: MPLS's ancestor. AAL5 (RFC 1483/2684) adds
// a trailer and padding, so the last cell is marked and the far router can glue the packet back together.
export default defineLayer({
  dive: 'atm-cells',
  fields: [
    { id: 'vpi', bits: 12, value: '1' },
    { id: 'vci', bits: 16, value: '{label}', use: true, kid: true },
    { id: 'pti', bits: 3, value: '000 (data)' },
    { id: 'clp', bits: 1, value: '0' },
    { id: 'hec', bits: 8, value: '{sum}', use: true },
  ],
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Asynchronous_Transfer_Mode', title: 'Asynchronous Transfer Mode', level: 'nerd', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Asynchronous_Transfer_Mode', title: 'Asynchronous Transfer Mode', level: 'nerd', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/ATM_Adaptation_Layer_5', title: 'AAL5', level: 'nerd', lang: 'en' },
  ],
});
