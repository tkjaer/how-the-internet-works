import { defineScene } from '$core/define';

export default defineScene({
  explains: 'layer',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/Asynchronous_Transfer_Mode', title: 'Asynchronous Transfer Mode', level: 'both', lang: 'en' },
    { url: 'https://de.wikipedia.org/wiki/Asynchronous_Transfer_Mode', title: 'Asynchronous Transfer Mode', level: 'both', lang: 'de' },
    { url: 'https://en.wikipedia.org/wiki/ATM_Adaptation_Layer_5', title: 'ATM Adaptation Layer 5', level: 'nerd', lang: 'en' },
    { url: 'https://www.rfc-editor.org/rfc/rfc1483', title: 'RFC 1483: multiprotocol over ATM AAL5 (1993)', level: 'nerd', lang: 'en' },
  ],
});
