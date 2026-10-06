import { defineLayer } from '$core/define';

export default defineLayer({
  fields: [
    { id: 'rnti', bits: 16, value: '0x4601', use: true, kid: true },
    { id: 'lcid', bits: 6, value: '4 (data)', use: true },
    { id: 'rlcsn', bits: 12, value: { up: '217', down: '1043' }, use: true },
    { id: 'pdcpsn', bits: 12, value: { up: '1851', down: '3702' }, use: true },
    { id: 'qfi', bits: 6, value: '9', use: true },
  ],
  dive: 'nr-grant',
  learnMore: [
    { url: 'https://en.wikipedia.org/wiki/5G_NR', title: '5G NR', level: 'both', lang: 'en' },
    { url: 'https://da.wikipedia.org/wiki/5G', title: '5G', level: 'both', lang: 'da' },
    { url: 'https://de.wikipedia.org/wiki/5G_NR', title: '5G NR', level: 'both', lang: 'de' },
    { url: 'https://www.sharetechnote.com/html/5G/5G_RNTI.html', title: 'Radio Network Temporary Identifier', level: 'nerd', lang: 'en' },
  ],
});
