import { defineNode } from '$core/define';

// A 10BASE-T hub (a multiport repeater), 1990s: every bit that comes in on one port goes out on all the others, so it
// reads nothing and the frames pass through it unchanged. Switches, which learn where each address is, took over later.
export default defineNode({
  kind: 'device',
  role: 'passive',
});
