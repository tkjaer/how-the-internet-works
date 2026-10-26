import { defineNode } from '$core/define';

// The ISP's border router (edge/peering router, ASBR): its door to the other networks, at the exchange or a carrier.
export default defineNode({
  kind: 'device',
  role: 'router',
  dive: 'border-inside',
});
