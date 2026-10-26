import { defineNode } from '$core/define';

// A GSM base station (BTS) of the 1990s: a lattice mast with rod aerials and its radios in a cabinet at the foot,
// and an E1 line back to its controller (the BSC).
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
