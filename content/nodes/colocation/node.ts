import { defineNode } from '$core/define';

// The data centre of 2010 (#59): a hall the video company rents at a colocation centre, in a bigger city further away
// than today's PoP, with a core router, a load balancer and a three-tier tree of switches. It stands in for today's data
// centre (the 2010 activity's group spec names it), so the instance id `datacentre`, and every URL into it, is the same
// in every era; it has a node of its own for its backdrop (a hall of grey racks in cages).
export default defineNode({
  kind: 'network',
});
