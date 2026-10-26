import { defineLayer } from '$core/define';

export default defineLayer({
  fields: [
    { id: 'rnti', bits: 16, value: '0x4601', use: true, simple: true },
    { id: 'lcid', bits: 6, value: '4 (data)', use: true },
    { id: 'rlcsn', bits: 12, value: { up: '217', down: '1043' }, use: true },
    { id: 'pdcpsn', bits: 12, value: { up: '1851', down: '3702' }, use: true },
    { id: 'qfi', bits: 6, value: '9', use: true },
  ],
  dive: 'nr-grant',
});
