import { defineNode } from '$core/define';

// An aggregation switch of 2010's three-tier data centre (#59): the middle of core → aggregation → access, where every
// rack's switch has its two uplinks and layer 2 ends. It stands at today's spine hop (the 2010 segment names it), so
// links and URLs carry over. Its dive shows the tree, with spanning tree blocking each rack's second uplink.
export default defineNode({
  kind: 'device',
  role: 'router',
  dive: 'three-tier',
});
