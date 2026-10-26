import { defineLayer } from '$core/define';

// 3G's radio layers for data: RLC (in the RNC) numbers, resends and ciphers the pieces; MAC-hs (in the NodeB) queues
// them and sends them in the 2 ms slots the NodeB's scheduler picks (HSDPA).
export default defineLayer({
  fields: [
    { id: 'hrnti', bits: 16, value: '0x2317', use: true, simple: true },
    { id: 'queue', bits: 3, value: '1', use: true },
    { id: 'tsn', bits: 6, value: { up: '12', down: '37' }, use: true },
    { id: 'rlcsn', bits: 12, value: { up: '905', down: '2214' }, use: true },
  ],
  dive: 'nr-grant',
});
