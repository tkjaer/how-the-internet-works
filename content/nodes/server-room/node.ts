import { defineNode } from '$core/define';

// A web site's server room in 1995 (#59): a small room at a university or a company, with a router on the T1, a hub
// and a few tower computers on shelves. It stands in for today's data centre (the activity's group spec names it), so
// the instance id `datacentre`, and every URL into it, is the same in every era.
export default defineNode({
  kind: 'network',
});
