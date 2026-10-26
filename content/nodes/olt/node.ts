import { defineNode } from '$core/define';

// The OLT at the exchange: the active end of the home's PON. It ends XGS-PON and bridges the Ethernet frames on.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
