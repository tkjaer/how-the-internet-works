import { defineTechnology } from '$core/define';

export default defineTechnology({
  look: 'fibre',
  colour: '#3aaea1',
  // XGS-PON: each Ethernet frame rides in an XGEM frame from the ONT to the OLT
  stack: ['gpon', 'ethernet'],
  dive: 'fibre-light',
  // a 1000/1000 plan (XGS-PON's 10 Gbit/s each way is shared by the homes on one splitter)
  rate: { down: 1e9, up: 1e9 },
});
