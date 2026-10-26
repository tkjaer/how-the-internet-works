import { defineNode } from '$core/define';

// A layer-4 load balancer: it owns the service address and picks one of many servers for each connection
export default defineNode({
  kind: 'device',
  role: 'router',
});
