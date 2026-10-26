import { defineNode } from '$core/define';

// A 3G radio network controller: the box behind dozens of NodeBs that ends the radio layers (RLC, ciphering) and,
// with Direct Tunnel, puts the phone's packets in a GTP-U tunnel straight to the GGSN.
export default defineNode({
  kind: 'device',
  role: 'bridge',
});
