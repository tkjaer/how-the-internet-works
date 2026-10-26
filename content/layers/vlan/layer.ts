import { defineLayer } from '$core/define';

export default defineLayer({
  dive: 'sticker-doors',
  code: { ethertype: '0x88A8 (802.1ad)' },
  fields: [
    { id: 'spcp', bits: 3, value: '0' },
    { id: 'sdei', bits: 1, value: '0' },
    // the outer tag names the street cabinet, the inner one the customer (the BNG's subscriber line)
    { id: 'svid', bits: 12, value: '101', use: true, simple: true },
    { id: 'ctpid', bits: 16, value: '0x8100' },
    { id: 'cpcp', bits: 3, value: '0' },
    { id: 'cdei', bits: 1, value: '0' },
    { id: 'cvid', bits: 12, value: '2042', use: ['router'], simple: true },
    { id: 'type', bits: 16, value: '{inner.ethertype}', use: ['router'] },
  ],
});
