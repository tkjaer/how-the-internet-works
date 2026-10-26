import { defineLayer } from '$core/define';

// the XGEM header of XGS-PON (ITU-T G.9807.1): 64 bits in front of each Ethernet frame on the fibre
export default defineLayer({
  fields: [
    { id: 'pli', bits: 14, value: '{payload}', use: true },
    { id: 'keyidx', bits: 2, value: '01' },
    // every house on the splitter hears everything going down; each ONT only keeps its own port
    { id: 'port', bits: 16, value: '1127', use: true, kid: true },
    { id: 'options', bits: 18, value: '0' },
    { id: 'lf', bits: 1, value: '1 (last fragment)' },
    { id: 'hec', bits: 13, value: '{sum}', use: true },
  ],
  dive: 'gpon-slots',
});
