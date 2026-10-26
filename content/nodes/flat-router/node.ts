import { defineNode } from '$core/define';

// The home router in a flat with fibre to the building: Wi-Fi in, NAT, and out through a plain Ethernet port to the
// switch in the basement (no light box of its own: the fibre ends downstairs).
export default defineNode({
  kind: 'device',
  role: 'nat',
  dive: 'router-inside',
});
