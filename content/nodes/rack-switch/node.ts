import { defineNode } from '$core/define';

// The top-of-rack switch: the leaf of the fabric, on top of one rack of servers
export default defineNode({
  kind: 'device',
  role: 'router',
});
